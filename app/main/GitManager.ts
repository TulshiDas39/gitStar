import { FileManager } from "./FileManager";
import simpleGit, { BranchSummary, GitError, LogResult, SimpleGit, SimpleGitOptions } from 'simple-git';
import path from "path";
import { app, ipcMain } from "electron";
import { mainWindow } from "../main.dev";
import { Main_Events, Renderer_Events } from "../constants/constants";
import { BranchDetails, ICommit, ILastCommitByRemote, ILastReference, IRepository, IRepositoryInfo, IResolvedBranch } from "../lib";
import moment from "moment";
import { CommitParser } from "../lib/utils/CommitParser";
import { LogFormat } from "./commands";

//HEAD ->
//"tag: v1.0.0, fb_video_download, a"
export const headPrefix = 'HEAD ->';
export class GitManager{
  
  private git: SimpleGit = null!;
  private initialRepoInfoValue:IRepositoryInfo = {
    allCommits:[],
    branchDetails:[],
    branchSummery:undefined!,
    commits:undefined!,
    lastReferencesByBranch:[],
    uniqueBrancNames:[],
    remotes:[],
    branchTree:[],
    resolvedBranches:[],
    headCommit:undefined!,
  };
  private repoInfo:IRepositoryInfo = this.initialRepoInfoValue;
  private limit = 500;
  private skip = 0

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
        this.setBranchSummery();


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
      const logCallBack=(_e,data:string)=>{
        const commits = CommitParser.parseLog(data);
        this.repoInfo.allCommits.push(...commits);
        this.setResolvedBranch(commits);
        this.sendRepoInfoToRenderer();
        // mainWindow?.webContents.send(Main_Events.REPO_INFO,this.repoInfo);
      }
      this.git.raw(["log", "--all",`--max-count=${this.limit}`,`--skip=${this.skip*this.limit}`,"--date=iso", LogFormat],logCallBack as any);
    }

    setResolvedBranch=(commits:ICommit[])=>{
      for(let commit of commits){
        this.setReference(commit);

        const branches = this.getBranchFromReference(commit.refs);

        if(!branches?.length) continue;
        branches.forEach(b=>{
          b = b.trim();
          b = this.setHeadCommit(b, commit);
          let branchName = "";
          let remote = "";
          let splits = b.split("/");
          if(splits.length>1){
            branchName = splits[1];
            remote = splits[0];           
          }
          else {
            branchName=b;
          }
          let resolvedBranch = this.repoInfo.resolvedBranches.find(x=>x.name === branchName)!;
          if(!resolvedBranch) {
            resolvedBranch = {
              lastReferenceDate:commit.date,
              lastCommitByRemote:[],
              firstCommitHash:"",
              name:branchName,
            } as IResolvedBranch;
            this.repoInfo.resolvedBranches.push(resolvedBranch);
          }
          resolvedBranch.lastCommitByRemote.push({
            commitHash:commit.hash,
            remote:remote,
          });

        })
      }
    }

  private setHeadCommit(b: string, commit: ICommit) {
    if (b.startsWith(headPrefix)) {
      this.repoInfo.headCommit = commit;
      b = b.replace(headPrefix, "").trim();
    }
    return b;
  }

    private setReference(commit: ICommit) {
      if (commit.message.includes(`branch '`)) {
        const referencedBranch = this.repoInfo.resolvedBranches.find(x => commit.message.includes(`branch '${x.name}'`));
        if (referencedBranch) {
          referencedBranch.lastReferenceDate = commit.date;
        }
      }
    }

    getBranchFromReference=(commitRef:string)=>{
      const splits = commitRef.split(",");
      if(!splits.length) return undefined;
      const branches:string[] = [];
      splits.forEach(spt=>{
        spt = spt.trim();
        if(spt.startsWith('tag:'))return;
        branches.push(spt);
      });
      return branches;      
    }

    setUniqueBranchNames=()=>{
      const uniqueBranchNames:string[]=[];
      this.repoInfo.branchSummery.all.forEach(b=>{
        const name=b.split("/").pop();
        if(!!name && !uniqueBranchNames.includes(name))uniqueBranchNames.push(name);
      })
      this.repoInfo.uniqueBrancNames = uniqueBranchNames;
      //this.setBranchDetails();
      // this.setLastReferencesOfBranches();
    }

    getFirstReferenceDateByBranch=(branchName:string)=>{
      const branch = this.repoInfo.lastReferencesByBranch.find(x=>x.branchName === branchName);
      if(branch) return branch.dateTime;
    
      let firstReferenceDate = new Date().toISOString();
      const referencedCommits = this.repoInfo.allCommits.filter(c=>!!c.message?.includes(`branch '${branchName}'`));
      referencedCommits.forEach(commit=>{
          if(moment(commit.date).isBefore(firstReferenceDate) ) firstReferenceDate = commit.date;
      });
      this.repoInfo.lastReferencesByBranch.push({
        branchName:branchName,
        dateTime:firstReferenceDate,
      })
      return firstReferenceDate;      

    }

    // setLastReferencesOfBranches=()=>{      
    //   this.repoInfo.lastReferencesByBranch = this.repoInfo.uniqueBrancNames.map(name=>({
    //     branchName:name,
    //     dateTime: new Date().toISOString(),
    //   }))
    //   this.repoInfo.lastReferencesByBranch.forEach(b=>{
    //     const referencedCommits = this.repoInfo.allCommits.filter(c=>!!c.message?.includes(`branch '${b.branchName}'`))
    //     referencedCommits.forEach(commit=>{
    //         if(moment(commit.date).isBefore(b.dateTime) ) b.dateTime = commit.date;
    //     })
    //   })
    //   this.setBranchDetails();
    // }

    setBranchDetails=()=>{
      this.repoInfo.uniqueBrancNames.forEach(b=>{
        this.setCommitsOfBranch(b);
      });
    }

    setCommitsOfBranch=(branchName:string)=>{
      // if(branchName.startsWith("remote/")) branchName = branchName.replace("remote/","");
      const lastCommitByRemote:ILastCommitByRemote[]=[];
      const branchIncludingRemotes:string[]=[];

      const logCallBack=(_e,data:string)=>{
        console.log('branchName:'+branchName);
        branchIncludingRemotes.forEach(b=>{
          const splits = b.split('/');
          let remote='';
          if(splits.length>1) {
            b='remotes/'+b;
            remote=splits[0];
          }
          const summery = this.repoInfo.branchSummery.branches[b];
          lastCommitByRemote.push({
            commitHash: summery.commit,
            remote:remote,
          })
        })
        this.repoInfo.branchDetails.push({
          commits:CommitParser.parseLog(data),
          lastCommitsByRemotes: lastCommitByRemote,
          name:branchName,
          noDerivedCommits:false,
        });
        //Layout-Refactoring-V2
        if(branchName === 'Layout-Refactoring-V2'){
          (this.repoInfo as any).test = branchIncludingRemotes;
          (this.repoInfo as any).test2 = data;
          (this.repoInfo as any).test3 = data.split('\n');
          this.sendRepoInfoToRenderer();

        }
        
        if(this.repoInfo.branchDetails.length === this.repoInfo.uniqueBrancNames.length) this.sendRepoInfoToRenderer(); //this.removeDerivedCommits();
        // mainWindow?.webContents.send(Main_Events.REPO_INFO,this.repoInfo);
      }
      if(this.repoInfo.branchSummery.all.includes(branchName)){
        branchIncludingRemotes.push(branchName);    
      }
      this.repoInfo.remotes.forEach(r=>{
        const remoteBranch = r+'/'+branchName;
        if(this.repoInfo.branchSummery.all.includes("remotes/"+remoteBranch)) branchIncludingRemotes.push(remoteBranch);
      })
      this.git.raw(["log","--first-parent","--max-count=100","--date=iso",LogFormat, ...branchIncludingRemotes],logCallBack as any);
    }

    normaliseCommits=()=>{
      this.repoInfo.uniqueBrancNames.forEach(name=>{
        const branch = this.repoInfo.branchDetails.find(x=>x.name === name);
        if(!branch) return;
        branch.lastCommitsByRemotes.push({commitHash:branch.commits[0],remote:""});

        this.repoInfo.remotes.forEach(r=>{
          const remoteBranchName = "remotes/"+r+"/"+name;
          const remoteBranch = this.repoInfo.branchDetails.find(x=>x.name ===  remoteBranchName);
          if(!remoteBranch) return;

          branch.lastCommitsByRemotes.push({
            commitHash:remoteBranch.commits[0],
            remote:r,
          });

          if(remoteBranch.commits.length > branch.commits.length) branch.commits = remoteBranch.commits;
          this.repoInfo.branchDetails = this.repoInfo.branchDetails.filter(b=> b.name !== remoteBranchName);
        })
      })
      this.removeDerivedCommits()
    }

    removeDerivedCommits=()=>{
      console.log('removing derived commits');
      this.repoInfo.branchDetails.forEach(b=>{
        if(b.noDerivedCommits) return;
        this.removeDerivedComitsOfBranch(b);
      })
      console.log('sending to renderer');
      this.sendRepoInfoToRenderer();
    }
    
    removeDerivedComitsOfBranch=(branch:BranchDetails)=>{
      const commitsFromSecond= branch.commits.slice(1);
      const branchesHavingDerivedCommit = this.repoInfo.branchDetails.filter(x=>!x.noDerivedCommits);

        for(let [indexC,c] of commitsFromSecond.entries()){
          if(branch.noDerivedCommits) break;
          const branchesOfThisCommit = branchesHavingDerivedCommit.filter(x=>x.commits.some(xc=>xc.hash === c.hash));
          if(branchesOfThisCommit.length === 1) {    
            if(indexC === commitsFromSecond.length-1)this.repoInfo.branchTree.push(branch);
            continue;
          };
          for(let [index,ob] of branchesOfThisCommit.entries()){
            if(this.isOwnerBranch(c,ob) || (index === branchesOfThisCommit.length-1)){
              const allOtherBranches = branchesOfThisCommit.filter(x=>x.name !== ob.name);
              allOtherBranches.forEach(alB=>{
                this.setFirstCommitOfBranch(c,alB);
              });
              break;
            }
          }
        }
    }

    isOwnerBranch=(commit:ICommit,branch:BranchDetails)=>{
      if(branch.commits[0].hash === commit.hash) return true;
      const lastReference = this.repoInfo.lastReferencesByBranch.find(b=>b.branchName === branch.name)?.dateTime!;
      if(moment(lastReference).isBefore(commit.date)) return true;
      if(branch.name === 'master') return true;
      if(branch.name === 'main') return true;      
      return false;
    }

    setFirstCommitOfBranch=(firstCommit:ICommit,branch:BranchDetails)=>{
      const index = branch.commits.findIndex(c=>c.hash === firstCommit.hash);
      branch.commits = branch.commits.slice(0,index);
      if(!!firstCommit.branchesFromThis?.length) firstCommit.branchesFromThis.push(branch);
      else firstCommit.branchesFromThis = [branch];
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
            },
            {
              name:'Downloader',
              path:path.join(app.getPath('documents'),'workspace','projects','downloader')
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
  
  //017