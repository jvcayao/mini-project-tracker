<?php

namespace Tests\Feature;

use App\Enums\ProjectStatus;
use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_projects(): void
    {
        Project::factory()->count(3)->create();

        $response = $this->getJson('/api/projects');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_can_filter_by_active_status(): void
    {
        Project::factory()->count(2)->create(['status' => ProjectStatus::Active]);
        Project::factory()->create(['status' => ProjectStatus::Archived]);

        $response = $this->getJson('/api/projects?status=active');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_can_filter_by_archived_status(): void
    {
        Project::factory()->count(2)->create(['status' => ProjectStatus::Active]);
        Project::factory()->create(['status' => ProjectStatus::Archived]);

        $response = $this->getJson('/api/projects?status=archived');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_can_create_project(): void
    {
        $response = $this->postJson('/api/projects', [
            'name' => 'Test Project',
            'description' => 'A test project',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Test Project');

        $this->assertDatabaseHas('projects', ['name' => 'Test Project']);
    }

    public function test_create_project_requires_name(): void
    {
        $response = $this->postJson('/api/projects', [
            'description' => 'missing name',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('name');
    }

    public function test_name_must_be_min_3_chars(): void
    {
        $response = $this->postJson('/api/projects', [
            'name' => 'ab',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('name');
    }

    public function test_can_show_project(): void
    {
        $project = Project::factory()->create();

        $response = $this->getJson("/api/projects/{$project->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $project->id);
    }

    public function test_can_update_project(): void
    {
        $project = Project::factory()->create();

        $response = $this->putJson("/api/projects/{$project->id}", [
            'name' => 'Updated Name',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Updated Name');
    }

    public function test_can_archive_project(): void
    {
        $project = Project::factory()->create(['status' => ProjectStatus::Active]);

        $response = $this->patchJson("/api/projects/{$project->id}/archive");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'archived');
    }

    public function test_can_unarchive_project(): void
    {
        $project = Project::factory()->create(['status' => ProjectStatus::Archived]);

        $response = $this->patchJson("/api/projects/{$project->id}/unarchive");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'active');
    }

    public function test_can_delete_project(): void
    {
        $project = Project::factory()->create();

        $response = $this->deleteJson("/api/projects/{$project->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('projects', ['id' => $project->id]);
    }

    public function test_deleting_project_cascades_tasks(): void
    {
        $project = Project::factory()->hasTasks(3)->create();

        $this->deleteJson("/api/projects/{$project->id}");

        $this->assertDatabaseCount('tasks', 0);
    }
}
