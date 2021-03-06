import { Item, Result } from "ytpl";

export interface IHomeState {
  url:string
};

export interface IHomeReducerState{
  inFetch:string[];
  downloadIds:string[];
}

export interface IPlaylistDownloadState{
  expanded:boolean,
  info?:Result,
  donloadPath:string,
  isDownloading:boolean,
  fetchingItem?:Item,
  downloadingItem?:Item,
  completedIds:string[];
  isAllSelected:boolean;
  selectedVideoIds:string[]
}
