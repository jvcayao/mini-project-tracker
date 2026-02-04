<?php

use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

Route::apiResource('projects', ProjectController::class);
Route::patch('projects/{project}/archive', [ProjectController::class, 'archive']);
Route::patch('projects/{project}/unarchive', [ProjectController::class, 'unarchive']);

Route::get('projects/{project}/tasks', [TaskController::class, 'index']);
Route::post('projects/{project}/tasks', [TaskController::class, 'store']);
Route::patch('projects/{project}/tasks/bulk-status', [TaskController::class, 'bulkUpdateStatus']);

Route::put('tasks/{task}', [TaskController::class, 'update']);
Route::patch('tasks/{task}/status', [TaskController::class, 'updateStatus']);
Route::delete('tasks/{task}', [TaskController::class, 'destroy']);
