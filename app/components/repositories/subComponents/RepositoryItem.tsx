import React from "react";
import { Link } from "react-router-dom";
import { IRepository } from "../../../lib";
import { UI_Routes } from "../../../lib/routes";

interface IProps{
    repo:IRepository;
    handleSelect:(repo:IRepository)=>void;
}

function RepositoryItemComponent(props:IProps){
    return (
        <div>
            <Link to={UI_Routes.REPOSITORY} onClick={() => props.handleSelect(props.repo)} className="hover-underline h5">{props.repo.name}</Link>
            <p>{props.repo.path}</p>
        </div>
    )
}

export const RepositoryItem = React.memo(RepositoryItemComponent);