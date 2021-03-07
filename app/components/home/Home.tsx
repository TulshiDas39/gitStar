import { ipcRenderer } from "electron";
import React, { useEffect } from "react";
import { Main_Events, Renderer_Events } from "../../constants/constants";
import './home.css';

interface IState{
  
}


 function HomeComponent(){
  
    useEffect(()=>{

      const handleTest=()=>{
        ipcRenderer.on(Main_Events.TEST,(_,data:any)=>{
          console.log(data);
        })
      }

      handleTest();

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
