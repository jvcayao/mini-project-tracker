<?php

namespace Tests\Feature;

use App\Enums\TaskStatus;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskTest extends TestCase
{
    use RefreshDatabase;

    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();
        $this->project = Project::factory()->create();
    }

    public function test_can_list_tasks(): void
    {
        Task::factory()->count(3)->create(['project_id' => $this->project->id]);

        $response = $this->getJson("/api/projects/{$this->project->id}/tasks");

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_can_filter_tasks_by_status(): void
    {
        Task::factory()->count(2)->create([
            'project_id' => $this->project->id,
            'status' => TaskStatus::Todo,
        ]);
        Task::factory()->create([
            'project_id' => $this->project->id,
            'status' => TaskStatus::Done,
        ]);

        $response = $this->getJson("/api/projects/{$this->project->id}/tasks?status=todo");

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_can_search_tasks_by_title(): void
    {
        Task::factory()->create([
            'project_id' => $this->project->id,
            'title' => 'fix the login bug',
        ]);
        Task::factory()->create([
            'project_id' => $this->project->id,
            'title' => 'add dark mode',
        ]);

        $response = $this->getJson("/api/projects/{$this->project->id}/tasks?search=login");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'fix the login bug');
    }

    public function test_tasks_are_paginated(): void
    {
        Task::factory()->count(15)->create(['project_id' => $this->project->id]);

        $response = $this->getJson("/api/projects/{$this->project->id}/tasks?per_page=5");

        $response->assertStatus(200)
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.total', 15)
            ->assertJsonPath('meta.per_page', 5);
    }

    public function test_can_sort_by_due_date(): void
    {
        Task::factory()->create([
            'project_id' => $this->project->id,
            'title' => 'later',
            'due_date' => '2025-12-31',
        ]);
        Task::factory()->create([
            'project_id' => $this->project->id,
            'title' => 'sooner',
            'due_date' => '2025-01-01',
        ]);

        $response = $this->getJson("/api/projects/{$this->project->id}/tasks?sort=due_date&order=asc");

        $response->assertStatus(200)
            ->assertJsonPath('data.0.title', 'sooner');
    }

    public function test_can_create_task(): void
    {
        $response = $this->postJson("/api/projects/{$this->project->id}/tasks", [
            'title' => 'new task here',
            'priority' => 'high',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.title', 'new task here');

        $this->assertDatabaseHas('tasks', ['title' => 'new task here']);
    }

    public function test_create_task_requires_title(): void
    {
        $response = $this->postJson("/api/projects/{$this->project->id}/tasks", [
            'priority' => 'low',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('title');
    }

    public function test_title_must_be_min_3_chars(): void
    {
        $response = $this->postJson("/api/projects/{$this->project->id}/tasks", [
            'title' => 'ab',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('title');
    }

    public function test_priority_must_be_valid_enum(): void
    {
        $response = $this->postJson("/api/projects/{$this->project->id}/tasks", [
            'title' => 'some task',
            'priority' => 'invalid',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('priority');
    }

    public function test_can_update_task(): void
    {
        $task = Task::factory()->create(['project_id' => $this->project->id]);

        $response = $this->putJson("/api/tasks/{$task->id}", [
            'title' => 'updated title',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.title', 'updated title');
    }

    public function test_can_update_task_status(): void
    {
        $task = Task::factory()->create([
            'project_id' => $this->project->id,
            'status' => TaskStatus::Todo,
        ]);

        $response = $this->patchJson("/api/tasks/{$task->id}/status", [
            'status' => 'done',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'done');
    }

    public function test_can_delete_task(): void
    {
        $task = Task::factory()->create(['project_id' => $this->project->id]);

        $response = $this->deleteJson("/api/tasks/{$task->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
    }

    public function test_can_bulk_update_task_status(): void
    {
        $tasks = Task::factory()->count(3)->create([
            'project_id' => $this->project->id,
            'status' => TaskStatus::Todo,
        ]);

        $response = $this->patchJson("/api/projects/{$this->project->id}/tasks/bulk-status", [
            'task_ids' => $tasks->pluck('id')->toArray(),
            'status' => 'done',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('updated_count', 3);

        foreach ($tasks as $task) {
            $this->assertDatabaseHas('tasks', [
                'id' => $task->id,
                'status' => 'done',
            ]);
        }
    }

    public function test_bulk_update_only_affects_project_tasks(): void
    {
        $otherProject = Project::factory()->create();
        $ourTask = Task::factory()->create([
            'project_id' => $this->project->id,
            'status' => TaskStatus::Todo,
        ]);
        $otherTask = Task::factory()->create([
            'project_id' => $otherProject->id,
            'status' => TaskStatus::Todo,
        ]);

        $this->patchJson("/api/projects/{$this->project->id}/tasks/bulk-status", [
            'task_ids' => [$ourTask->id, $otherTask->id],
            'status' => 'done',
        ]);

        // our task should be updated
        $this->assertDatabaseHas('tasks', ['id' => $ourTask->id, 'status' => 'done']);
        // other project's task should NOT be updated
        $this->assertDatabaseHas('tasks', ['id' => $otherTask->id, 'status' => 'todo']);
    }
}
