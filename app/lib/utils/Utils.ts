export class Utils{
    static getWords(str:string){
        return str.split(/(\s+)/).filter( e => e.trim().length > 0);
    }
}