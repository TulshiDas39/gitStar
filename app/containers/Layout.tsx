import React, { PropsWithChildren } from "react";
import { TopNav } from "../components/common";
import { Modals } from "../components/common/Modals";

function LayoutComponent(props:PropsWithChildren<React.ReactNode>){
  return (
    <div style={{height:'100vh',overflow:'overlay'}}>
      <Modals/>
      <TopNav />
      <div style={{height:'95%'}}>
        {props.children}
      </div>
    </div>
  )
}

export const Layout = React.memo(LayoutComponent);