import { FileManager } from "./FileManager";
import simpleGit, { BranchSummary, DefaultLogFields, GitError, LogResult, SimpleGit, SimpleGitOptions } from 'simple-git';
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

        const logCallBack=(_,data:LogResult<DefaultLogFields>)=>{
          mainWindow?.webContents.send(Main_Events.TEST,data);
        }
         const summery = git.log(["--all"],logCallBack as any);

        const branchCallback=(error:GitError,data:BranchSummary)=>{
          mainWindow?.webContents.send(Main_Events.ALL_BRANCH,data);
        }
         git.branch(["-a"],branchCallback as any);
        // git.branch(["-a"],branchCallBack)
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
  