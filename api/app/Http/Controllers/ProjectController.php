<?php

namespace App\Http\Controllers;

use App\Enums\ProjectStatus;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProjectController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Project::withCount('tasks');

        if ($request->has('status') && in_array($request->status, ['active', 'archived'])) {
            $query->where('status', $request->status);
        }

        $projects = $query->latest()->get();

        return ProjectResource::collection($projects);
    }

    public function store(StoreProjectRequest $request): ProjectResource
    {
        $project = Project::create($request->validated());
        $project->loadCount('tasks');

        return new ProjectResource($project);
    }

    public function show(Project $project): ProjectResource
    {
        $project->loadCount('tasks');

        return new ProjectResource($project);
    }

    public function update(UpdateProjectRequest $request, Project $project): ProjectResource
    {
        $project->update($request->validated());
        $project->refresh()->loadCount('tasks');

        return new ProjectResource($project);
    }

    public function destroy(Project $project)
    {
        $project->delete();

        return response()->noContent();
    }

    public function archive(Project $project): ProjectResource
    {
        $project->update(['status' => ProjectStatus::Archived]);
        $project->loadCount('tasks');

        return new ProjectResource($project);
    }

    public function unarchive(Project $project): ProjectResource
    {
        $project->update(['status' => ProjectStatus::Active]);
        $project->loadCount('tasks');

        return new ProjectResource($project);
    }
}
