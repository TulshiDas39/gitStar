import React from "react";

function TopNavComponent(){
    return (
        <div className="d-flex border">
            <p className="">Repositories</p>
        </div>
    )
}

export const TopNav = React.memo(TopNavComponent);