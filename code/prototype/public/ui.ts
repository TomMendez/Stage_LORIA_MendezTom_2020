import { Subject, Observable } from 'rxjs';
import { message } from './interface.js';

export class ui{

  private subjApp = new Subject();
  private subjRes = new Subject();

  private num : number;
  private bloques : Set<number>;
  
  constructor(){
    this.bloques = new Set();
    this.num=0;

    document.querySelector('#close')!.addEventListener('click', function() {
      this.subjRes.close();
    });
    
    document.querySelector('#submbitChar')!.addEventListener('click', function() {
      const char = (<HTMLTextAreaElement>document.querySelector('#char')).value;
      this.subjApp.next({type:"ajoutChar",contenu:char});
    });
  }

  getObsApp(){
    return this.subjApp.asObservable();
  }

  getObsRes(){
    return this.subjRes.asObservable();
  }

  setObsIn(obs : Observable<any>){
    obs.subscribe(this.dispatcher); //On stocke potentiellement la souscription DEBUG
  }

  dispatcher(data : message){
    if(data.type==="log"){
      this.log(data.contenu);
    }else if(data.type==="actuCollab"){
      this.actualCollaborateurs(new Map(JSON.parse(data.contenu)));
    }else if(data.type==="actuSet"){
      this.actualSet(new Set(JSON.parse(data.contenu)));
    }else if(data.type==="numUpdate"){
      this.num=data.contenu;
    }else if(data.type==="bloquesUpdate"){
      this.bloques=new Set(JSON.parse(data.contenu));
    }else{
      this.log("ERREUR: type inconnu dans le dispatcher UI");
    }
  }

  actualCollaborateurs(collaborateurs : Map<number,string>){
      $("#collaborateurs").empty();
      for(const [key,value] of collaborateurs) {
        if(key===this.num){
          $(`<li class="collabo">
                <p>Collaborateur ` + key + ` (you)</p> 
              </li>`).appendTo($("#collaborateurs"));
        }else{
          let block = '';
          if(this.bloques.has(key)){
            block = 'X';
          }
          $(`<li class="collabo">
                <p>Collaborateur ` + key + ' (' + value + ') ' + block + `</p> 
                <INPUT type="submit" class="ping" value="ping" num="` + key + `">
                <INPUT type="submit" class="bloquer" value="bloquer" num="` + key + `">
              </li>`).appendTo($("#collaborateurs"));
        }
      }
    
      if(document.querySelector('.ping')!=null){
        document.querySelectorAll('.ping').forEach(function(elem){
          elem.addEventListener('click', function(event) {
            const numCollab = parseInt((<HTMLTextAreaElement>event.target).getAttribute("num")!,10);
            this.subjApp.next({type: "pingUI", contenu:numCollab});
    
          });
        });
    
        document.querySelectorAll('.bloquer').forEach(function(elem){
          elem.addEventListener('click', function(event) {
            const numero = parseInt((<HTMLTextAreaElement>event.target).getAttribute("num")!,10);
            this.subjRes.next({type:"bloquage",contenu:numero});
          });
        });
      }
    }

    actualSet(set : Set<string>){
      $("#set").empty();
      $(`<p style="text-align: center">Etat acutel du set [` + String(Array.from(set)) + `]</p>`).appendTo($("#set"));
    }

    log(text : string) {
        const li = document.createElement('li');
        li.innerHTML = text;
        document.getElementById('log')!.appendChild(li);
    }

}