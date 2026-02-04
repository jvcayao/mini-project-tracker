<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Requests\UpdateTaskStatusRequest;
use App\Http\Resources\TaskResource;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Concurrency;

class TaskController extends Controller
{
    public function index(Request $request, Project $project)
    {
        $searchTerm = $request->filled('search') ? $request->search : null;
        $statusFilter = $request->has('status') && in_array($request->status, ['todo', 'in_progress', 'done'])
            ? $request->status
            : null;

        $sortField = $request->get('sort', 'created_at');
        $order = $request->get('order', 'desc');

        if (! in_array($sortField, ['due_date', 'priority', 'created_at'])) {
            $sortField = 'created_at';
        }

        if (! in_array($order, ['asc', 'desc'])) {
            $order = 'desc';
        }

        $perPage = min((int) $request->get('per_page', 10), 100);

        // run both queries concurrently
        [$paginated, $counts] = Concurrency::run([
            function () use ($project, $searchTerm, $statusFilter, $sortField, $order, $perPage) {
                $query = $project->tasks();

                if ($searchTerm) {
                    $query->where('title', 'like', '%'.$searchTerm.'%');
                }

                if ($statusFilter) {
                    $query->where('status', $statusFilter);
                }

                if ($sortField === 'priority') {
                    $query->orderByRaw("FIELD(priority, 'high', 'medium', 'low') ".($order === 'asc' ? 'DESC' : 'ASC'));
                } else {
                    $nullHandling = $sortField === 'due_date' ? ($order === 'asc' ? 'LAST' : 'FIRST') : '';
                    if ($nullHandling) {
                        $query->orderByRaw("CASE WHEN {$sortField} IS NULL THEN 1 ELSE 0 END ".($order === 'asc' ? 'ASC' : 'DESC'))
                            ->orderBy($sortField, $order);
                    } else {
                        $query->orderBy($sortField, $order);
                    }
                }

                return $query->paginate($perPage);
            },
            function () use ($project) {
                return $project->tasks()
                    ->selectRaw('status, count(*) as count')
                    ->groupBy('status')
                    ->pluck('count', 'status')
                    ->toArray();
            },
        ]);

        $response = TaskResource::collection($paginated);

        return $response->additional([
            'counts' => [
                'total' => array_sum($counts),
                'todo' => $counts['todo'] ?? 0,
                'in_progress' => $counts['in_progress'] ?? 0,
                'done' => $counts['done'] ?? 0,
            ],
        ]);
    }

    public function store(StoreTaskRequest $request, Project $project): TaskResource
    {
        $task = $project->tasks()->create($request->validated());

        return new TaskResource($task);
    }

    public function update(UpdateTaskRequest $request, Task $task): TaskResource
    {
        $task->update($request->validated());

        return new TaskResource($task->fresh());
    }

    public function updateStatus(UpdateTaskStatusRequest $request, Task $task): TaskResource
    {
        $task->update(['status' => $request->validated('status')]);

        return new TaskResource($task->fresh());
    }

    public function destroy(Task $task)
    {
        $task->delete();

        return response()->noContent();
    }

    public function bulkUpdateStatus(Request $request, Project $project)
    {
        $validated = $request->validate([
            'task_ids' => 'required|array|min:1',
            'task_ids.*' => 'integer|exists:tasks,id',
            'status' => 'required|in:todo,in_progress,done',
        ]);

        // only update tasks that belong to this project
        $updated = $project->tasks()
            ->whereIn('id', $validated['task_ids'])
            ->update(['status' => $validated['status']]);

        return response()->json([
            'message' => "{$updated} tasks updated",
            'updated_count' => $updated,
        ]);
    }
}
