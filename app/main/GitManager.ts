import { FileManager } from "./FileManager";
import simpleGit, { BranchSummary, GitError, LogResult, SimpleGit, SimpleGitOptions, SimpleGitTaskCallback } from 'simple-git';
import path from "path";
import { app, ipcMain } from "electron";
import { mainWindow } from "../main.dev";
import { Main_Events, Renderer_Events } from "../constants/constants";
import { BranchDetails, ICommit, IRepository, IRepositoryInfo } from "../lib";
import moment from "moment";


export class GitManager{

  private git: SimpleGit = null!;
  private initialRepoInfoValue:IRepositoryInfo = {
    branchDetails:[],
    branchSummery:undefined!,
    commits:undefined!,
    lastReferencesByBranch:[],
    uniqueBrancNames:[],
    remotes:[],
  };
  private repoInfo:IRepositoryInfo = this.initialRepoInfoValue;

    constructor(){
      this.init()
    }
  
    init(){
      // this.configureRepo();
      this.handleRendererEvents();
      new FileManager();
    }

    configureRepo(repoPath:string){
      this.repoInfo = this.initialRepoInfoValue;
      console.log(repoPath);
        // const repoPath = path.join(app.getPath('documents'),'workspace','joylist','joylist-webapp');
        const options: Partial<SimpleGitOptions> = {
            baseDir: repoPath,
            binary: 'git',
            maxConcurrentProcesses: 6,
         };
        this.git = simpleGit(options);   

        // const repoInfo:IRepositoryInfo={} as any;

        // const getLogs=()=>{
        //   const logCallBack=(_,data:LogResult<ICommit>)=>{
        //     this.repoInfo.commits = data;
        //     this.getBranchDetails();
        //     // mainWindow?.webContents.send(Main_Events.REPO_INFO,this.repoInfo);
        //   }
        //   this.git.log(["--first-parent","--all"],logCallBack as any);
        // }
        //this.setLogs();
        this.setRemotes();

        // const branchCallback=(error:GitError,data:BranchSummary)=>{
        //   this.repoInfo.branchSummery = data;
        //   getLogs();
        // }
        // this.git.branch(["-a"],branchCallback as any);
        // git.branch(["-a"],branchCallBack)
         //console.log(summery);
    }

    setRemotes=()=>{
      const callBack=(_e,data:string)=>{
        this.repoInfo.remotes = data.split('\n').filter(x=>!!x);
        this.setLogs();
      }
      this.git.remote([],callBack as any)
    }

    setBranchSummery=()=>{
      const branchCallback=(_error:GitError,data:BranchSummary)=>{
        this.repoInfo.branchSummery = data;
        this.setUniqueBranchNames();
      }
      this.git.branch(["-a"],branchCallback as any);
    }

    setLogs=()=>{
      const logCallBack=(_e,data:LogResult<ICommit>)=>{
        this.repoInfo.commits = data;
        this.setBranchSummery();
        // mainWindow?.webContents.send(Main_Events.REPO_INFO,this.repoInfo);
      }
      this.git.log(["--first-parent","--max-count=200","--date=iso"],logCallBack as any);
    }

    setUniqueBranchNames=()=>{
      const uniqueBranchNames:string[]=[];
      this.repoInfo.branchSummery.all.forEach(b=>{
        const name=b.split("/").pop();
        if(!!name && !uniqueBranchNames.includes(name))uniqueBranchNames.push(name);
      })
      this.repoInfo.uniqueBrancNames = uniqueBranchNames;
      this.setLastReferencesOfBranches();
    }

    setLastReferencesOfBranches=()=>{      
      this.repoInfo.lastReferencesByBranch = this.repoInfo.uniqueBrancNames.map(name=>({
        branchName:name,
        dateTime: new Date().toISOString(),
      }))
      this.repoInfo.lastReferencesByBranch.forEach(b=>{
        const referencedCommits = this.repoInfo.commits.all.filter(c=>!!c.message?.includes(`branch '${b.branchName}'`))
        referencedCommits.forEach(commit=>{
            if(moment(commit.date).isBefore(b.dateTime) ) b.dateTime = commit.date;
        })
      })
      this.setBranchDetails();
    }

    setBranchDetails=()=>{
      this.repoInfo.branchSummery.all.forEach(b=>{
        this.setCommitsOfBranch(b);
      }) 
    }

    setCommitsOfBranch=(branchName:string)=>{
      // if(branchName.startsWith("remote/")) branchName = branchName.replace("remote/","");
      const logCallBack=(_e,data:LogResult<ICommit>)=>{
        this.repoInfo.branchDetails.push({
          commits:[...data.all],
          lastCommitsByRemotes:[],
          name:branchName,
          noDerivedCommits:false,
        });
        if(this.repoInfo.branchDetails.length === this.repoInfo.branchSummery.all.length) this.normaliseCommits();
        // mainWindow?.webContents.send(Main_Events.REPO_INFO,this.repoInfo);
      }
      this.git.log(["--first-parent","--max-count=100","--date=iso", branchName],logCallBack as any);
    }

    normaliseCommits=()=>{
      this.repoInfo.uniqueBrancNames.forEach(name=>{
        const branch = this.repoInfo.branchDetails.find(x=>x.name === name);
        if(!branch) return;
        branch.lastCommitsByRemotes.push({commit:branch.commits[0],remote:""});

        this.repoInfo.remotes.forEach(r=>{
          const remoteBranchName = "remotes/"+r+"/"+name;
          const remoteBranch = this.repoInfo.branchDetails.find(x=>x.name ===  remoteBranchName);
          if(!remoteBranch) return;

          branch.lastCommitsByRemotes.push({
            commit:remoteBranch.commits[0],
            remote:r,
          });

          if(remoteBranch.commits.length > branch.commits.length) branch.commits = remoteBranch.commits;
          this.repoInfo.branchDetails = this.repoInfo.branchDetails.filter(b=> b.name !== remoteBranchName);
        })
      })
      this.removeDerivedCommits()
    }

    removeDerivedCommits=()=>{
      this.repoInfo.branchDetails.forEach(b=>{
        if(b.noDerivedCommits) return;
        const commitsFromSecond= b.commits.slice(1);
        for(let c of commitsFromSecond){
          const branchesOfThisCommit = this.repoInfo.branchDetails.filter(x=>x.commits.some(xc=>xc.hash === c.hash));
          if(branchesOfThisCommit.length === 1) continue;
          for(let ob of branchesOfThisCommit){
            if(ob.commits[ob.commits.length-1].hash === c.hash){
              const allOtherBranches = branchesOfThisCommit.filter(x=>x.name !== ob.name);
              allOtherBranches.forEach(alB=>{
                if(alB.noDerivedCommits) return;
                this.removeDerivedCommitsFromBranch(c,alB);
              })
            }
          }
        }
      })
      this.sendRepoInfoToRenderer();
    }

    removeDerivedCommitsFromBranch=(lastCommit:ICommit,branch:BranchDetails)=>{
      const index = branch.commits.findIndex(c=>c.hash === lastCommit.hash);
      branch.commits = branch.commits.slice(0,index+1);
      branch.noDerivedCommits = true;
    }

    sendRepoInfoToRenderer=()=>{
      mainWindow?.webContents.send(Main_Events.REPO_INFO,this.repoInfo);
    }
  
    handleGetCommitList=()=>{
      // ipcMain.on(Renderer_Events.GET_COMMIT_LIST,(_,repo:IRepository)=>{
      //   this.configureRepo(repo.path);
      // })
    }

    handleGetRepoInfo=()=>{
      ipcMain.on(Renderer_Events.GET_REPO_INFO,(_,repo:IRepository)=>{
        this.configureRepo(repo.path);
      })
    }

    handleRepositoryList=()=>{
      ipcMain.on(Renderer_Events.GET_REPOSITORIES,()=>{
          const repositoryList:IRepository[]=[
            {
              name: 'joylist-webapp',
              path: path.join(app.getPath('documents'),'workspace','joylist','joylist-webapp'),
            },
            {
              name: 'P1stonUIRepo',
              path: path.join(app.getPath('documents'),'workspace','piston','P1stonUIRepo'),
            }
          ];
          mainWindow?.webContents.send(Main_Events.ALL_REPOSITORIES,repositoryList);
      })
    }

    handleRendererEvents(){
      // this.handleGetCommitList();
      this.handleGetRepoInfo();
      this.handleRepositoryList();
    }
  
  }
  