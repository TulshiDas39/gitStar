import { FileManager } from "./FileManager";
import simpleGit, { BranchSummary, GitError, SimpleGit, SimpleGitOptions } from 'simple-git';
import path from "path";
import { app, ipcMain } from "electron";
import { mainWindow } from "../main.dev";
import { MainBranchName, Main_Events, Renderer_Events } from "../constants/constants";
import { BranchDetails, IBranchRemote, ICommit, ILastCommitByRemote, IRepository, IRepositoryInfo, IResolvedBranch } from "../lib";
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
    mergeCommitMessages:[],
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
        //this.setResolvedBranch(commits);
        this.createTree2();
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
      }
      this.createTree2();
      this.fixTreeSubBranches();

    }
    createTree2(){
      const commits = this.repoInfo.allCommits.slice();
      this.repoInfo.branchTree = [];
      let ownerBranch:BranchDetails=null! ;
      let createNewBranch = (parentCommit?:ICommit)=>{
        ownerBranch = {
          commits:[],
          name:"",
          parentCommit:parentCommit,
          lastCommitsByRemotes:[],
          noDerivedCommits:false,
        }
        if(!parentCommit)this.repoInfo.branchTree.push(ownerBranch);
        //set parent commit of new branch
        this.repoInfo.branchDetails.push(ownerBranch);        
      }
      for(let i=commits.length-1; i>=0; i--){
        const currentCommit = commits[i];
        this.setReference(currentCommit);
        currentCommit.referedBranches = this.getBranchFromReference(currentCommit.refs);
        currentCommit.branchNameWithRemotes = currentCommit.referedBranches?.map(x=>this.getBranchRemote(x));        
        let previousCommit = commits.find(c=>c.avrebHash === currentCommit.parentHashes[0]);

        //console.log()
        if(previousCommit){
          if(previousCommit.nextCommit){
            //create new unnamed branch and assign it to branch
            createNewBranch(previousCommit);
            //if(this.repoInfo.lastReferencesByBranch.some(x=>x.message.includes(`branch ${}`)))
            //currentCommit.ownerBranch
            //set parent commit of new branch
            //this.repoInfo.branchDetails.push(branch);
            //push it to branch list
          }else{
              //set the branch from owner branch property of parent commit
              ownerBranch=previousCommit.ownerBranch;              
          }                  
        }
        else{
          //create new unnamed branch and assign it to branch
          createNewBranch();
          //currentCommit.ownerBranch = branch;
        }

        currentCommit.ownerBranch = ownerBranch;

        if(!!currentCommit.branchNameWithRemotes?.length){
            //check parent branch is same
            const parentBranch = currentCommit.ownerBranch?.parentCommit?.ownerBranch;
            if(parentBranch && currentCommit.branchNameWithRemotes?.some(x=>x.branchName === parentBranch.name)){
              //push all the commits of current branch to parent branch and delete the current branch
              parentBranch.commits.push(...ownerBranch.commits);
              ownerBranch.commits.forEach(c=>{
                c.ownerBranch = parentBranch;
              });
              //if(ownerBranch.parentCommit) ownerBranch.parentCommit.branchesFromThis = ownerBranch.parentCommit.branchesFromThis.filter(x=>x.n)
              currentCommit.ownerBranch=parentBranch;
            }
            else{
              //set the current branch name,push the commit to this branch
              const remoteBranch = currentCommit.branchNameWithRemotes?.find(x=>!!x.remote);
              currentCommit.ownerBranch.name = remoteBranch?.branchName|| currentCommit.branchNameWithRemotes[0].branchName;
              currentCommit.ownerBranch.commits.forEach(c=>{
                c.ownerBranch = ownerBranch;
              })
              const parentCommitOfOwnerBranch = ownerBranch.parentCommit;
              if(parentCommitOfOwnerBranch) {
                parentCommitOfOwnerBranch.branchesFromThis.push(ownerBranch);
              }
            }
        }        

        currentCommit.ownerBranch.commits.push(currentCommit);
        if(currentCommit.ownerBranch.name) {
          //currentCommit.ownerBranch = ownerBranch;
          currentCommit.previousCommit = previousCommit;
        }
      }
    }
    fixTreeSubBranches=()=>{
      for(let branch of this.repoInfo.branchDetails){
        if(branch.noDerivedCommits) continue;
        if(MainBranchName.includes(branch.name)) {
          branch.noDerivedCommits = true;
          continue;
        }
        const parentCommit = branch.parentCommit!;
        let foundOwnerBranch:BranchDetails=null!;        
        for(let subBranch of parentCommit.branchesFromThis){
          if(this.repoInfo.lastReferencesByBranch.some(ref=>ref.message.includes(`branch ${subBranch.name}`) &&
                moment(ref.dateTime).isBefore(parentCommit.date) )
                || MainBranchName.includes(subBranch.name)){
            foundOwnerBranch = subBranch
            break;
          }
        }
        if(foundOwnerBranch) {
          this.moveCommitsToNewBranch(parentCommit,foundOwnerBranch);          
        }
        parentCommit.branchesFromThis.forEach(br=>br.noDerivedCommits = true);
        branch.noDerivedCommits = true;
        parentCommit.ownerBranch.noDerivedCommits = true;
      }
    }

    moveCommitsToNewBranch=(commit:ICommit,branch:BranchDetails)=>{
      const existingBranch = commit.ownerBranch;
      const commitIndex = existingBranch.commits.findIndex(x=>x.hash === commit.hash);
      const commitsToMove = existingBranch.commits.splice(0,commitIndex+1);
      commitsToMove.forEach(x=>x.ownerBranch = branch);
      branch.commits=[...commitsToMove,...branch.commits];

    }

    sendTestData=(data:any)=>{
      mainWindow?.webContents.send(Main_Events.TEST,data);
    }

    tryResolveBranchName=(commit:ICommit,branch:BranchDetails)=>{      
      const branchName = commit.branchNameWithRemotes?.find(x=>!!x.remote)?.branchName;
      if(!branchName) return;
      branch.name = branchName;                        
    }

    handleNewBranch=(currentCommit:ICommit,parentBranch:BranchDetails)=>{
      if(currentCommit.branchNameWithRemotes?.some(x=>x.branchName === parentBranch.name)) return;
      const newBranchName = currentCommit.branchNameWithRemotes?.find(x=>x.branchName !== parentBranch.name)?.branchName;
      if(newBranchName) {
        const latestCommitIndexOfParentBranch = parentBranch.commits.findIndex(x=>x.branchNameWithRemotes?.some(n=>n.branchName === parentBranch.name))!;
        const latestCommitOfParentBranch = parentBranch.commits[latestCommitIndexOfParentBranch];
        const newBranch:BranchDetails={
          commits: parentBranch.commits.splice(0,latestCommitIndexOfParentBranch),
          name: newBranchName,
          noDerivedCommits:false,
          lastCommitsByRemotes:[],
        }
        latestCommitOfParentBranch.branchesFromThis=[newBranch];
      }
    }

    getBranch=(commit:ICommit,tree:IResolvedBranch[])=>{
      const branch = tree.find(tr=> tr.commits[0].avrebHash === commit.parentHashes[0]);
      
    }

  private setHeadCommit(b: string, commit: ICommit) {
    if (b.startsWith(headPrefix)) {
      this.repoInfo.headCommit = commit;
      b = b.replace(headPrefix, "").trim();
    }
    return b;
  }

    private setReference(commit: ICommit) {    
      if(commit.message?.includes(`branch '`) ) this.repoInfo.lastReferencesByBranch.push({
        message:commit.message,
        dateTime:commit.date
      })      
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

 

    resolveCommitsOfBranch=(resolvedBranch:IResolvedBranch)=>{
      resolvedBranch.commits = [];
      let commit = resolvedBranch.latestCommit;
      resolvedBranch.commits.push(commit);
      while(true){
        
      }
      // const currentCommit = this.repoInfo.allCommits.find(x=>x.hash === resolvedBranch.la)
    }

    getReferedBranch=(commit:ICommit)=>{
      const ref = commit.refs?.trim();
      if(!ref) return undefined;
      const branches = this.getBranchFromReference(ref);
      if(!branches?.length)return undefined;
      let branchWithRemotes = branches.map(b=> this.getBranchRemote(b));
      branchWithRemotes = branchWithRemotes.filter((b,index,arr)=> arr.findIndex(x=>x.branchName === b.branchName) === index);
      const branchNames = branchWithRemotes.map(x=>x.branchName);
      branchNames;
    }

    getBranchRemote=(branchNameStr:string)=>{
      let branchName = "";
      let remote = "";
      let splits = branchNameStr.split("/");
      if (splits.length > 1) {
        branchName = splits[1];
        remote = splits[0];
      }
      else {
        branchName = branchNameStr;
      }
      const branchRemote:IBranchRemote={
        branchName:branchName,
        remote:remote,
      }
      return branchRemote;
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
      const branch = this.repoInfo.lastReferencesByBranch.find(x=>x.message === branchName);
      if(branch) return branch.dateTime;
    
      let firstReferenceDate = new Date().toISOString();
      const referencedCommits = this.repoInfo.allCommits.filter(c=>!!c.message?.includes(`branch '${branchName}'`));
      referencedCommits.forEach(commit=>{
          if(moment(commit.date).isBefore(firstReferenceDate) ) firstReferenceDate = commit.date;
      });
      this.repoInfo.lastReferencesByBranch.push({
        message:branchName,
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
        branch.lastCommitsByRemotes.push({commitHash:branch.commits[0].hash,remote:""});

        this.repoInfo.remotes.forEach(r=>{
          const remoteBranchName = "remotes/"+r+"/"+name;
          const remoteBranch = this.repoInfo.branchDetails.find(x=>x.name ===  remoteBranchName);
          if(!remoteBranch) return;

          branch.lastCommitsByRemotes.push({
            commitHash:remoteBranch.commits[0].hash,
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
      const lastReference = this.repoInfo.lastReferencesByBranch.find(b=>b.message === branch.name)?.dateTime!;
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
  
  //1800855