<?php

namespace App\Services;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;

class DynamicStorageService
{
    /**
     * Configure dynamic storage disks based on database settings
     */
    public static function configureDynamicDisks(): void
    {
        try {
            $config = StorageConfigService::getStorageConfig();
            
            // Configure S3 disk if credentials exist
            if (!empty($config['s3']['key']) && !empty($config['s3']['secret'])) {
                self::configureS3Disk($config['s3']);
            }
            
            // Configure Wasabi disk if credentials exist
            if (!empty($config['wasabi']['key']) && !empty($config['wasabi']['secret'])) {
                self::configureWasabiDisk($config['wasabi']);
            }
        } catch (\Exception $e) {
            \Log::error('Failed to configure dynamic storage disks', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
    
    /**
     * Configure S3 disk
     */
    private static function configureS3Disk(array $s3Config): void
    {
        // For standard AWS S3, endpoint should be null
        $endpoint = null;
        if (!empty($s3Config['endpoint']) && !str_contains($s3Config['endpoint'], 'amazonaws.com')) {
            $endpoint = $s3Config['endpoint'];
        }
        
        $diskConfig = [
            'driver' => 's3',
            'key' => $s3Config['key'],
            'secret' => $s3Config['secret'],
            'region' => $s3Config['region'],
            'bucket' => $s3Config['bucket'],
            'url' => $s3Config['url'] ?: null,
            'endpoint' => $endpoint,
            'use_path_style_endpoint' => false,
            'throw' => true,
        ];
        
        Config::set('filesystems.disks.s3', $diskConfig);
        
        // Force filesystem manager to reload
        app()->forgetInstance('filesystem');
        app('filesystem')->purge('s3');
    }
    
    /**
     * Configure Wasabi disk
     */
    private static function configureWasabiDisk(array $wasabiConfig): void
    {
        $region = $wasabiConfig['region'] ?: 'us-east-1';
        $endpoint = 'https://s3.' . $region . '.wasabisys.com';
        $bucketUrl = $endpoint . '/' . $wasabiConfig['bucket'];
        
        $diskConfig = [
            'driver' => 's3',
            'key' => $wasabiConfig['key'],
            'secret' => $wasabiConfig['secret'],
            'region' => $region,
            'bucket' => $wasabiConfig['bucket'],
            'url' => $bucketUrl,
            'endpoint' => $endpoint,
            'use_path_style_endpoint' => true,
            'visibility' => 'public',
            'throw' => false,
        ];
        
        Config::set('filesystems.disks.wasabi', $diskConfig);
        
        // Force filesystem manager to reload
        app()->forgetInstance('filesystem');
        app('filesystem')->purge('wasabi');
    }

    /**
     * Get the active storage disk instance
     */
    public static function getActiveDiskInstance()
    {
        $diskName = StorageConfigService::getActiveDisk();
        
        // Ensure disk is configured
        self::configureDynamicDisks();
        
        try {
            return Storage::disk($diskName);
        } catch (\Exception $e) {
            return Storage::disk('public');
        }
    }

    /**
     * Test storage connection
     */
    public static function testConnection(string $diskName): bool
    {
        try {
            self::configureDynamicDisks();
            $disk = Storage::disk($diskName);
            
            // For S3, try a simple exists check first
            if ($diskName === 's3' || $diskName === 'wasabi') {
                // Try to list files (this tests read permissions)
                $files = $disk->files('', true);
                
                // Try to write and read a test file
                $testContent = 'connection-test-' . time() . '-' . uniqid();
                $testPath = 'connection-tests/test-' . uniqid() . '.txt';
                
                // Test write
                $writeSuccess = $disk->put($testPath, $testContent);
                if (!$writeSuccess) {
                    return false;
                }
                
                // Test read
                $retrieved = $disk->get($testPath);
                
                // Test delete
                $disk->delete($testPath);
                
                return $retrieved === $testContent;
            } else {
                // For local storage, use simpler test
                $testContent = 'test-' . time();
                $testPath = 'test-connection-' . uniqid() . '.txt';
                
                $disk->put($testPath, $testContent);
                $retrieved = $disk->get($testPath);
                $disk->delete($testPath);
                
                return $retrieved === $testContent;
            }
        } catch (\Exception $e) {
            return false;
        }
    }
}