import { ipcRenderer } from "electron";
import React, { useEffect } from "react";
import { Main_Events, Renderer_Events } from "../../constants/constants";
import { IRepository } from "../../lib";
import { useMultiState } from "../common/hooks";
import './home.css';


interface IState{
  repositoryList:IRepository[];
}

const initialState:IState={
  repositoryList:[],
}


 function RepositoriesComponent(){
    const [state,setState]= useMultiState<IState>(initialState);

    useEffect(()=>{
      
      const handleRepositories=()=>{
        ipcRenderer.on(Main_Events.ALL_REPOSITORIES,(_,data:IRepository[])=>{
          setState({repositoryList:data});
        })
      }

      handleRepositories();

      ipcRenderer.send(Renderer_Events.GET_REPOSITORIES);

    },[])

    return (
      <div className="container text-center">
        {
          state.repositoryList.map(x=>(
            <div key={x.path}>
              <h5>{x.name}</h5>
              <p>{x.path}</p>
            </div>
          ))
        }
      </div>
    )
}
export const Repositories = React.memo(RepositoriesComponent);
