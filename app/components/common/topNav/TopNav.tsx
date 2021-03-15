import React from "react";
import { useHistory } from "react-router";
import { UI_Routes } from "../../../lib/routes";

function TopNavComponent(){
    const history = useHistory();
    return (
        <div className="d-flex border topNav">
            <p className="cursor-pointer" onClick={()=>history.push(UI_Routes.ROOT)}>Repositories</p>
        </div>
    )
}

export const TopNav = React.memo(TopNavComponent);