import { Subject } from 'rxjs';
import { num } from './app';
import { bloq, bloques } from './res';

export const actualCollaborateurs = function(collaborateurs){
    $("#collaborateurs").empty();
    for(const [key,value] of collaborateurs) {
      if(key===num){
        $(`<li class="collabo">
              <p>Collaborateur ` + key + ` (you)</p> 
            </li>`).appendTo($("#collaborateurs"));
      }else{
        let block = '';
        if(bloques.has(key)){
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
  
          pingProcedure(parseInt((<HTMLTextAreaElement>event.target).getAttribute("num")!,10)); //DEBUG à changer
  
        });
      });
  
      document.querySelectorAll('.bloquer').forEach(function(elem){
        elem.addEventListener('click', function(event) {
          const numero = parseInt((<HTMLTextAreaElement>event.target).getAttribute("num")!,10);
          bloq.next(numero);
        });
      });
    }
  }

  export const actualSet = function(set){
    $("#set").empty();
    $(`<p style="text-align: center">Etat acutel du set [` + String(Array.from(set)) + `]</p>`).appendTo($("#set"));
  }

export const log = new Subject();
const obsLog = log.asObservable();
obsLog.subscribe(function(text : string) {
    const li = document.createElement('li');
    li.innerHTML = text;
    document.getElementById('log')!.appendChild(li);
  });

export const actuCollab = new Subject();
const obsCollab = actuCollab.asObservable();
obsCollab.subscribe(actualCollaborateurs);

export const actuSet = new Subject();
const obsSet = actuSet.asObservable();
actuSet.subscribe(actualSet);