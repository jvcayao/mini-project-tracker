<?php

namespace Database\Seeders;

use App\Enums\ProjectStatus;
use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\Project;
use Faker\Factory as Faker;
use Illuminate\Database\Seeder;

class ProjectSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        $projects = [
            [
                'name' => 'Website Redesign',
                'description' => 'Marketing wants a fresh look before Q2. New homepage + about page, keep the blog as is for now.',
                'status' => ProjectStatus::Active,
            ],
            [
                'name' => 'Mobile App v2',
                'description' => 'Bug fixes mostly, plus dark mode that everyone keeps asking for.',
                'status' => ProjectStatus::Active,
            ],
            [
                'name' => 'Legacy System Migration',
                'description' => 'Moved everything from the old inventory system. Done.',
                'status' => ProjectStatus::Archived,
            ],
        ];

        $taskTemplates = [
            // Website Redesign tasks
            ['title' => 'fix mobile nav not closing', 'priority' => TaskPriority::High, 'status' => TaskStatus::Done],
            ['title' => 'new hero section from figma', 'priority' => TaskPriority::High, 'status' => TaskStatus::Done],
            ['title' => 'contact form keeps timing out', 'priority' => TaskPriority::High, 'status' => TaskStatus::InProgress],
            ['title' => 'add team page photos', 'priority' => TaskPriority::Medium, 'status' => TaskStatus::Todo],
            ['title' => 'footer links are broken on /about', 'priority' => TaskPriority::Low, 'status' => TaskStatus::Todo],

            // Mobile App v2 tasks
            ['title' => 'push notifs not working on android', 'priority' => TaskPriority::High, 'status' => TaskStatus::InProgress],
            ['title' => 'dark mode toggle', 'priority' => TaskPriority::Medium, 'status' => TaskStatus::Done],
            ['title' => 'profile pic upload crashes on ios', 'priority' => TaskPriority::High, 'status' => TaskStatus::Todo],
            ['title' => 'remember me checkbox', 'priority' => TaskPriority::Low, 'status' => TaskStatus::Done],
            ['title' => 'loading spinner looks weird', 'priority' => TaskPriority::Low, 'status' => TaskStatus::InProgress],

            // Legacy System Migration tasks (archived)
            ['title' => 'export old inventory data', 'priority' => TaskPriority::High, 'status' => TaskStatus::Done],
            ['title' => 'map fields to new schema', 'priority' => TaskPriority::High, 'status' => TaskStatus::Done],
            ['title' => 'test import script on staging', 'priority' => TaskPriority::Medium, 'status' => TaskStatus::Done],
            ['title' => 'verify counts match after migration', 'priority' => TaskPriority::High, 'status' => TaskStatus::Done],
            ['title' => 'cleanup old db backups', 'priority' => TaskPriority::Low, 'status' => TaskStatus::Done],
        ];

        $taskIndex = 0;
        $tasksPerProject = [5, 5, 5];

        foreach ($projects as $index => $projectData) {
            $project = Project::create($projectData);

            for ($i = 0; $i < $tasksPerProject[$index]; $i++) {
                $template = $taskTemplates[$taskIndex % count($taskTemplates)];

                $project->tasks()->create([
                    'title' => $template['title'],
                    'details' => $faker->optional(0.5)->paragraph(),
                    'priority' => $template['priority'],
                    'status' => $template['status'],
                    'due_date' => $faker->optional(0.7)->dateTimeBetween('now', '+3 months')?->format('Y-m-d'),
                ]);

                $taskIndex++;
            }
        }
    }
}
