//paramètres de la simulation
export const coef = 200; //coefficient appliqué à tous les délais (timeouts / fréquence de ping aléatoires)
export const K = 2; //K est le nombre de personnes à qui ont transmet les messages de PGexport
export const nbPR = 2; //nbPR est le nombre de client qui reçoivent un ping-req dans la pingProcedure (ou moins si il n'y pas assez de clients)