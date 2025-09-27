import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createRepository, uploadFileToRepo } from "./github";
import fs from 'fs/promises';
import path from 'path';

export async function registerRoutes(app: Express): Promise<Server> {
  // GitHub repository creation endpoint
  app.post('/api/github/create-repo', async (req, res) => {
    try {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Repository name is required' });
      }
      
      const repo = await createRepository(name, description || '');
      res.json({ 
        success: true, 
        repository: {
          name: repo.name,
          full_name: repo.full_name,
          html_url: repo.html_url,
          clone_url: repo.clone_url
        }
      });
    } catch (error: any) {
      console.error('Failed to create GitHub repository:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Upload project to GitHub
  app.post('/api/github/upload-project', async (req, res) => {
    try {
      const { owner, repo } = req.body;
      
      if (!owner || !repo) {
        return res.status(400).json({ error: 'Owner and repo are required' });
      }

      // Define project files to upload
      const filesToUpload = [
        // Frontend files
        'client/index.html',
        'client/src/main.tsx',
        'client/src/App.tsx',
        'client/src/index.css',
        'client/src/pages/Home.tsx',
        'client/src/components/TypingGame.tsx',
        
        // Configuration files
        'package.json',
        'tailwind.config.ts',
        'tsconfig.json',
        'vite.config.ts',
        
        // Server files
        'server/index.ts',
        'server/vite.ts',
        'server/routes.ts',
        'server/storage.ts',
        'server/github.ts',
        
        // Shared files
        'shared/schema.ts',
        
        // Other config files
        'drizzle.config.ts'
      ];

      const uploadResults = [];
      
      for (const filePath of filesToUpload) {
        try {
          const fullPath = path.join(process.cwd(), filePath);
          const content = await fs.readFile(fullPath, 'utf-8');
          
          await uploadFileToRepo(
            owner,
            repo,
            filePath,
            content,
            `Upload ${filePath}`
          );
          
          uploadResults.push({ file: filePath, status: 'success' });
        } catch (error: any) {
          console.error(`Failed to upload ${filePath}:`, error);
          uploadResults.push({ 
            file: filePath, 
            status: 'error', 
            error: error.message 
          });
        }
      }

      res.json({ 
        success: true, 
        message: `Uploaded ${uploadResults.filter(r => r.status === 'success').length} files`,
        results: uploadResults
      });
    } catch (error: any) {
      console.error('Failed to upload project:', error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
