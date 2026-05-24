<?php

use App\Models\Conversation;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
}, ['guards' => ['sanctum']]);


Broadcast::channel('conversations.{conversation}', function ($user, Conversation $conversation) {
    return $conversation->users->contains($user);
}, ['guards' => ['sanctum']]);

//online/ offline status
Broadcast::channel('online', function ($user) {
    return ['id' => $user->id, 'name' => $user->name];
}, ['guards' => ['sanctum']]);
