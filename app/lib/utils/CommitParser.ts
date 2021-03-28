import { ICommit } from "../interfaces";
import { Utils } from "./Utils";

export class CommitParser{


    private static addCommitField(line:string,commit:ICommit){
        if(line.startsWith('commit ')) {
            commit.hash = Utils.getWords(line)[1];
            commit.avrebHash = commit.hash;
        }
        else if(line.startsWith('Merge:')){
            const ids = line.replace('Merge:','');
            commit.mergeInfo = Utils.getWords(ids);
        }
        else if(line.startsWith('Author:')){
            const author = line.replace("Author:","");
            const strs = Utils.getWords(author);
            commit.author_email = strs.pop()?.replace(/[<,>]/g,"")!;
            commit.author_name = strs.join(' ');
        }
        else if(line.startsWith('Date:')){
            commit.date = line.replace("Date:","").trim();
        }
    }

    private static getCommit(lines:string[],indexObj:{index:number}){
        const commit = {} as ICommit;
        for(let line of lines){
            if(line.startsWith('    ')) {
                commit.message = line.trim();
                return commit;
            }
            this.addCommitField(line,commit);
            indexObj.index++;
        }
    }
    static parseLog(str:string){
        const lines:string[]= str.split('\n');
        const commits:ICommit[]=[];
        let indexObj = {index:0};
        while(indexObj.index <= lines.length){
            const commit:ICommit = this.getCommit(lines,indexObj)!;
            commits.push(commit);
            indexObj.index++;
        }

        return commits;
    }
}