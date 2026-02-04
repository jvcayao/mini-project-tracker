<?php

namespace App\Enums;

enum ProjectStatus: string
{
    case Active = 'active';
    case Archived = 'archived';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
