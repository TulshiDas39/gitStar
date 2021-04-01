import { LogFields } from "../../constants/constants";
import { ICommit } from "../interfaces";
import { Utils } from "./Utils";

export class CommitParser{


    private static addCommitField(line:string,commit:ICommit){
        if(line.startsWith(LogFields.Hash)) {
            commit.hash = line.replace(LogFields.Hash+":","");
        }
        if(line.startsWith(LogFields.Abbrev_Hash)) {
            commit.avrebHash = line.replace(LogFields.Abbrev_Hash+":","");
        }

        else if(line.startsWith(LogFields.Parent_Hashes)){
            const ids = line.replace(LogFields.Parent_Hashes+":",'');
            commit.parentHashes = Utils.getWords(ids);
        }
        else if(line.startsWith(LogFields.Author_Name)){
            commit.author_name = line.replace(LogFields.Author_Name+":","");
        }
        else if(line.startsWith(LogFields.Author_Email)){
            commit.author_email = line.replace(LogFields.Author_Email+":","");
        }
        else if(line.startsWith(LogFields.Date)){
            commit.date = line.replace(LogFields.Date+":","").trim();
        }
        else if(line.startsWith(LogFields.Message)) {
            commit.message = line.replace(LogFields.Message+":","");
        }
        else if(line.startsWith(LogFields.Ref)){
            commit.refs =line.replace(LogFields.Ref+":","");
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
            if(!!commit.hash && line.startsWith(LogFields.Hash)){
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