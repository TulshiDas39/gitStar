import React, { useEffect } from 'react';
import { useSelectorTyped } from '../../store';
import { RepoLeftNav, RepoRightPanel, TRepoLeftTab } from './subComponents';
import { useMultiState } from '../common/hooks';
import { useDispatch } from 'react-redux';
import { ActionRepository } from './slice';
import { ipcRenderer } from 'electron';
import { Main_Events, Renderer_Events } from '../../constants/constants';
import { IRepositoryInfo } from '../../lib';

interface IState{
    selectedTab:TRepoLeftTab;
    repoInfo:IRepositoryInfo;
}

const initialState:IState={
    selectedTab:"commit",
    repoInfo:null!,
}

function RepositoryComponent(){
    const store = useSelectorTyped(state=>({
        repository:state.repository
    }))

    const [state,setState]= useMultiState(initialState);
    const dispatch = useDispatch();

    useEffect(()=>{
        ipcRenderer.on(Main_Events.REPO_INFO, (_, data: IRepositoryInfo) => {
            console.log(data);
            setState({ repoInfo: data });
        })

        return ()=>{
            dispatch(ActionRepository.setRepository(undefined!));
        }
    },[])

    useEffect(()=>{
        if(store.repository.selectedRepository) ipcRenderer.send(Renderer_Events.GET_REPO_INFO,store.repository.selectedRepository);
    },[store.repository.selectedRepository])

    if(!store.repository) return <p>No Repository Selected</p>;
    return (
        <div className="row no-gutters h-100">
            <RepoLeftNav onTabChange={(tab)=>setState({selectedTab:tab})} selectedTab={state.selectedTab} />
            <RepoRightPanel selectedTab={state.selectedTab}/>
        </div>
    )
}

export const Repository = React.memo(RepositoryComponent);