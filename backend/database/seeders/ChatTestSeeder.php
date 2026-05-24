<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Conversation;

class ChatTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create test users
        $user1 = User::create([
            'name' => 'Omar Faruk',
            'email' => 'kaziomar@yopmail.com',
            'email_verified_at' => now(),
            'password' => Hash::make('11111111'),
        ]);

        $user2 = User::create([
            'name' => 'Test User',
            'email' => 'test@yopmail.com',
            'email_verified_at' => now(),
            'password' => Hash::make('11111111'),
        ]);

        // Create a 1:1 conversation between them
        $conversation = Conversation::create([
            'created_by' => $user1->id,
        ]);

        // Attach users to the conversation
        $conversation->users()->attach([$user1->id, $user2->id]);
    }
}
