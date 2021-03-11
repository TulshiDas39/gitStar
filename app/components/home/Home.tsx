import { ipcRenderer } from "electron";
import React, { useEffect } from "react";
import { BranchSummary, DefaultLogFields, LogResult } from "simple-git";
import { Main_Events, Renderer_Events } from "../../constants/constants";
import './home.css';

interface IState{
  
}


 function HomeComponent(){
  
    useEffect(()=>{

      const handleTest=()=>{
        ipcRenderer.on(Main_Events.TEST,(_,data:LogResult<DefaultLogFields>)=>{
          console.log(data);
        })
      }

      const handleBranchlist=()=>{
        ipcRenderer.on(Main_Events.ALL_BRANCH,(_,data:BranchSummary)=>{
          console.log(data);

        })
      }

      handleTest();
      handleBranchlist();

    },[])

    const test=()=>{
      ipcRenderer.send(Renderer_Events.TEST);
    }

    return (
      <div className="container text-center homeComponent">
        hello
        <button onClick={test}>Test</button>
      </div>
    )
}


// const mapStateToProps = (state:IReduxState)=>state.home;
// const connector = connect(mapStateToProps);
export const Home = React.memo(HomeComponent);
