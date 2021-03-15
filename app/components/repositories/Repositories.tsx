import { ipcRenderer } from "electron";
import React, { useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Main_Events, Renderer_Events } from "../../constants/constants";
import { IRepository } from "../../lib";
import { useMultiState } from "../common/hooks";
import { ActionRepository } from "../repository/slice";
import { RepositoryItem } from "./subComponents";


interface IState{
  repositoryList:IRepository[];
}

const initialState:IState={
  repositoryList:[],
}


 function RepositoriesComponent(){
    const [state,setState]= useMultiState<IState>(initialState);
    const dispatch = useDispatch();

    useEffect(()=>{
      
      const handleRepositories=()=>{
        ipcRenderer.on(Main_Events.ALL_REPOSITORIES,(_,data:IRepository[])=>{
          setState({repositoryList:data});
        })
      }

      handleRepositories();

      ipcRenderer.send(Renderer_Events.GET_REPOSITORIES);

    },[])


    const handleSelect = useCallback((x:IRepository)=>{
      dispatch(ActionRepository.setRepository(x));
    },[])

    return (
      <div className="container text-center">
        {
          state.repositoryList.map(x=>(
            <RepositoryItem key={x.path} handleSelect={handleSelect} repo={x} />
          ))
        }
      </div>
    )
}
export const Repositories = React.memo(RepositoriesComponent);
