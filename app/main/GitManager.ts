import { FileManager } from "./FileManager";
import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';
import path from "path";
import { app } from "electron";


export class GitManager{

    constructor(){
      this.init()
    }
  
    init(){
      this.configureRepo();
      this.handleRendererEvents();
      new FileManager();
    }

    configureRepo(){
        const repoPath = path.join(app.getPath('documents'),'workspace','projects','downloader');
        console.log(repoPath);
        const options: Partial<SimpleGitOptions> = {
            baseDir: repoPath,
            binary: 'git',
            maxConcurrentProcesses: 6,
         };
         const git: SimpleGit = simpleGit(options);
        //  let callback: SimpleGitTaskCallback<resp.BranchSummary>={
             
        //  }
        //log --graph --pretty=oneline --abbrev-commit
         const summery = git.log([],console.log);
         //console.log(summery);
    }
  
    handleRendererEvents(){
      
    }
  
  }
  