import { FileManager } from "./FileManager";
import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';
import path from "path";
import { app, ipcMain } from "electron";
import { mainWindow } from "../main.dev";
import { Main_Events, Renderer_Events } from "../constants/constants";


export class GitManager{

    constructor(){
      this.init()
    }
  
    init(){
      // this.configureRepo();
      this.handleRendererEvents();
      new FileManager();
    }

    configureRepo(){
        const repoPath = path.join(app.getPath('documents'),'workspace','joylist','joylist-webapp');
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

         const summery = git.log(["--all","--decorate","--oneline","--graph"],(...data:any[])=>{
          console.log(data);
          mainWindow?.webContents.send(Main_Events.TEST,data);
         });
         //console.log(summery);
    }
  
    handleTest=()=>{
      ipcMain.on(Renderer_Events.TEST,()=>{
        this.configureRepo();
      })
    }

    handleRendererEvents(){
      this.handleTest();
    }
  
  }
  