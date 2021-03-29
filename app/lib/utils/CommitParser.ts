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
        else if(line.startsWith('    ')) {
            commit.message = line.trim();
        }
    }

    private static getCommit(lines:string[],indexObj:{index:number}){
        const commit = {} as ICommit;
        while(true){
            if(indexObj.index >= lines.length) return commit;
            //console.log(indexObj.index);            
            const line = lines[indexObj.index];
            //console.log(line);
            if(!line) {
                indexObj.index++
                continue;
            }
            if(!!commit.hash && line.startsWith('commit ')){
                indexObj.index--;
                return commit;
            }
            
            this.addCommitField(line,commit);
            indexObj.index++
        }
    }
    static parseLog(str:string){
        const lines:string[]= str.split('\n');
        const commits:ICommit[]=[];
        let indexObj = {index:0};

        while(indexObj.index < lines.length){
            const commit:ICommit = this.getCommit(lines,indexObj)!;
            //console.log(commit.hash);
            commits.push(commit);
            indexObj.index++;
            //console.log("index", indexObj.index);
        }

        return commits;
    }
}