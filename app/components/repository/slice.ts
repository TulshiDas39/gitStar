import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IRepository } from "../../lib";

interface IRepositoryReducerState{
  selectedRepository:IRepository;
}

const initialState:IRepositoryReducerState={
  selectedRepository:undefined!,
}
const repositorySlice = createSlice({
  initialState:initialState,
  name:'repository',
  reducers:{
    setRepository(state,action:PayloadAction<IRepository>){
      state.selectedRepository = action.payload;
    }
  }
})

export const RepositoryReducer = repositorySlice.reducer;
export const ActionRepository = repositorySlice.actions;
