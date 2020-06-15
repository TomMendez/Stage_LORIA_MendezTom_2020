import { Subject, Observable } from 'rxjs';
import * as i from './interface.js';

export class ui{

  private subjApp : Subject<i.message>;
  private subjRes : Subject<i.message>;

  private num : number;
  private bloques : Set<number>;
  
  constructor(){
    this.subjApp = new Subject();
    this.subjRes = new Subject();
    this.bloques = new Set();
    this.num=0;

    const vui = this;
    document.querySelector('#close')!.addEventListener('click', function() {
      vui.subjApp.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"stop",contenu:undefined});
      $("#titre").empty();
      $(`<h1 style="text-align: center; color: red">Collaborateur ` + vui.num + ` CONNEXION CLOSED</h1>`).appendTo($("#titre"));
    });
    
    document.querySelector('#submbitChar')!.addEventListener('click', function() {
      const char = (document.querySelector('#char') as HTMLTextAreaElement).value;
      vui.subjApp.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"ajoutChar",contenu:char});
    });
  }

  getObsApp(){
    return this.subjApp.asObservable();
  }

  getObsRes(){
    return this.subjRes.asObservable();
  }

  setObsIn(obs : Observable<i.message>){
    obs.subscribe((data) => {
      this.dispatcher(data)
    }); //On stocke potentiellement la souscription DEBUG
  }

  dispatcher(data : i.message){
    if(data.typeM==="log"){
      this.log(data.contenu);
    }else if(data.typeM==="actuCollab"){
      this.actualCollaborateurs(data.contenu);
    }else if(data.typeM==="actuSet"){
      this.actualSet(data.contenu);
    }else if(data.typeM==="numUpdate"){
      this.num=data.contenu;
      $(`<h1 style="text-align: center">Collaborateur ` + this.num + `</h1>`).appendTo($("#titre")); 
    }else if(data.typeM==="bloquesUpdate"){
      this.bloques=data.contenu;
    }else if(data.typeM==="stop"){
      $("#titre").empty();
      $(`<h1 style="text-align: center; color: red">Collaborateur ` + this.num + ` CONNEXION CLOSED</h1>`).appendTo($("#titre"));
    }else{
      this.log("ERREUR: type inconnu dans le dispatcher UI: " + data.typeM);
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
      
      const subjApp=this.subjApp;
      const subjRes=this.subjRes;
      if(document.querySelector('.ping')!=null){
        document.querySelectorAll('.ping').forEach(function(elem){
          elem.addEventListener('click', function(event) {
            const numCollab = parseInt((event.target as HTMLTextAreaElement).getAttribute("num")!,10);
            subjApp.next({type:i.TYPE_MESINTERNE_LABEL, typeM: "pingUI", contenu:numCollab});
    
          });
        });
    
        document.querySelectorAll('.bloquer').forEach(function(elem){
          elem.addEventListener('click', function(event) {
            const numero = parseInt((event.target as HTMLTextAreaElement).getAttribute("num")!,10);
            subjRes.next({type:i.TYPE_MESINTERNE_LABEL, typeM:"bloquage",contenu:numero});
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