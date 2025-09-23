# Guide d'utilisation

## Le Frontend

La plateforme que nous avons implémentée est composée de différentes pages, chacune permettant d’effectuer des tâches spécifiques et destinée à un acteur particulier.

### Page d'accueil
Il s’agit de la première page qui s’affiche lorsque l’expérimentateur accède à notre plateforme.

Cette page comporte un bouton permettant d’accéder à la page de création de formulaires, afin de créer un nouveau formulaire.

Elle présente aussi un champ de texte dans lequel l’expérimentateur peut saisir l’id du participant par défaut. Cet ID sera ajouté dynamiquement à l’URL d’accès d’un formulaire si celui-ci contient le symbole-clé @ à la place de l’ID du participant.
 Ainsi, une URL de la forme :
 http://localhost:3000/form-viewer/ID_du_formulaire/numéro_de_la_page/@
 sera dynamiquement remplacée par :
http://localhost:3000/form-viewer/ID_du_formulaire/numéro_de_la_page/ID_participant_par_défaut

Cela s’avère utile dans les cas où l’expérimentateur fait passer les participants un par un lors de chaque test. Avant de lancer un test sur une machine, il lui suffit alors de saisir l’ID du participant dans ce champ de texte pour que les formulaires remplis soient automatiquement associés à cet utilisateur. Lorsqu’un nouveau participant se présente, l’expérimentateur n’aura qu’à modifier l’ID par défaut dans ce même champ.

Cette page contient également la liste des formulaires créés précédemment. Pour chaque formulaire on peut voir : son identifiant, son titre, sa date et heure de création, la date et heure de la dernière modification, ainsi que cinq boutons : 
* Voir : permet d’accéder à une page de consultation du formulaire.
* Modifier : permet d’accéder à une page pour modifier le formulaire, si cela est possible.
* Voir réponses : permet d’accéder à une page affichant la liste des réponses des participants aux différentes questions du formulaire.
* Dupliquer : Permettant de dupliquer le formulaire.
* Supprimer : Permettant de supprimer le formulaire.

![alt text](<Guide Images/UI17.JPG>)


### La page de création de formulaires

La page de création de formulaires permet de construire un formulaire en ajoutant les composants (ou widgets) nécessaires. Elle est composée de trois parties :
* À gauche, on trouve les différents composants pouvant être ajoutés au formulaire, en les faisant glisser vers la zone centrale.
* Au centre, se trouve le formulaire en cours de création.
* À droite, sont affichés des paramètres spécifiques permettant de modifier le comportement et les propriétés du composant sélectionné (ou du formulaire en général si aucun composant n’est sélectionné), tels que l’affichage conditionnel, les règles de validation ou encore le caractère obligatoire d’une réponse.

Nous avons utilisé la librairie Form.js pour implémenter cette fonctionnalité. Grâce à son système de Drag and Drop, elle rend la création de formulaires plus simple et intuitive pour les expérimentateurs. Elle permet également de modifier la position des widgets sur la page du formulaire ainsi que l’espace qu’ils occupent, offrant ainsi une grande liberté en matière de mise en page.

Form.js propose une large panoplie de composants, notamment des champs de texte, d’images, de dates, des cases à cocher (checkbox), des boutons radio, des listes déroulantes, et bien plus encore. Même si certains widgets nécessaires ne sont pas inclus par défaut, il est possible de les définir et de les rendre disponibles à l’utilisateur final.

Nous avons également ajouté la possibilité pour l’expérimentateur de saisir un titre pour le formulaire, à l’aide d’un champ de texte situé en haut de la page.

Enfin, pour créer un formulaire composé de plusieurs pages (formulaire multipage), il suffit d’ajouter le composant appelé "separator". Comme son nom l’indique, ce composant permet de séparer les différentes pages d’un même formulaire. Dans l’image ci-après de la page de création de formulaires, le séparateur est représenté par une ligne horizontale grise qui divise visuellement deux pages du formulaire. Lors de la consultation du formulaire, chaque page sera alors affichée séparément.

![alt text](<Guide Images/UI18.JPG>)

Dans l’image suivante, on peut voir que lorsqu’un composant du formulaire est sélectionné, il est possible de le supprimer. À droite, apparaissent les paramètres spécifiques à ce composant, que l’on peut modifier.

![alt text](<Guide Images/UI20.JPG>)

### La page de modification de formulaires
On accède à cette page lorsqu’on choisit de modifier un formulaire. Elle présente le formulaire sélectionné et offre la possibilité d’apporter toute modification souhaitée à ce dernier.

`Remarque :` si un formulaire a déjà été rempli par un participant, il devient impossible de le modifier.

La figure ci-après est une capture d’écran de la page de modification de formulaires.

![alt text](<Guide Images/UI19.JPG>)

### La page de consultation de formulaires (vue de l’expérimentateur)

Dans cette page, l’expérimentateur peut consulter un formulaire. En haut de la page, des instructions lui indiquent quelle URL saisir dans Tobii Pro Lab pour que le participant soit dirigé vers la page correspondante du formulaire, dans le cadre d’un scénario d’expérimentation (voir l’explication de l’utilisation des URLs pour la navigation entre notre plateforme et Tobii Pro Lab ici). 

On peut également remarquer la présence des boutons “Page suivante” et “Page précédente”, permettant de naviguer d’une page à l’autre dans le cas d’un formulaire multipage.

Cette page présente deux vues :
* Une vue pour l’expérimentateur, accessible via une URL de la forme :
 http://localhost:3000/form-viewer/ID_du_formulaire/numéro_de_la_page
* Une vue pour le participant, qui est amené à remplir le formulaire, accessible via une URL de la forme :
http://localhost:3000/form-viewer/ID_du_formulaire/numéro_de_la_page/ID_du_participant
 
La figure suivante présente la vue de l’expérimentateur de la page de consultation de formulaires.

![alt text](<Guide Images/UI29.JPG>)

### La page de consultation de formulaires (vue du participant)
Dans cette vue, le participant est amené à remplir le formulaire affiché, ou une page spécifique de celui-ci.

Grâce à la fonctionnalité de sauvegarde automatique, les réponses saisies par le participant sont enregistrées au fur et à mesure du remplissage, plus précisément à chaque fois qu’un champ est modifié (événement onchange). Cela garantit qu’aucune réponse ne sera perdue en cas de panne ou d’imprévu.

Comme on peut le voir dans les deux figures ci-après, lorsqu’on accède à la page via une URL de la forme :
http://localhost:3000/form-viewer/ID_du_formulaire/numéro_de_la_page/ID_du_participant?navigation=True
le participant a la possibilité de naviguer entre les pages du formulaire.

En revanche, si l’on retire le paramètre ?navigation=True de l’URL, la navigation devient impossible. Cela est utile si l’on souhaite que le participant remplisse différentes pages du formulaire à des moments distincts de l’expérimentation.

##### Page de consultation de formulaires, vue du participant, (avec option de navigation)
![alt text](<Guide Images/UI23.JPG>)

##### Page de consultation de formulaires, vue du participant, (sans option de navigation)
![alt text](<Guide Images/UI24.JPG>)

### La page de consultation des réponses à un formulaire
Dans cette page, on trouve un tableau contenant les réponses des participants ayant rempli le formulaire concerné. Chaque colonne représente une question du formulaire et chaque ligne correspond aux réponses d’un participant (identifié par son ID).

On y trouve un bouton permettant de télécharger le tableau au format CSV, ainsi qu’un bouton “Supprimer toutes les réponses”, permettant d'effacer toutes les réponses présentes dans le tableau.

Vous pouvez voir dans la figure ci-après une capture d’écran de cette page.

![alt text](<Guide Images/UI25.JPG>)

### La duplication d’un formulaire
Dans la page d’accueil, chaque formulaire créé peut être dupliqué via le bouton “Dupliquer” correspondant. Cette action génère une copie du formulaire avec les mêmes composants et la même mise en page, mais attribue un nouvel ID au formulaire dupliqué ainsi qu’à chacun de ses composants.

Les réponses des participants ne sont pas dupliquées et ne sont donc pas associées au nouveau formulaire.

Cela permet à l’expérimentateur de créer rapidement un nouveau formulaire similaire à un formulaire existant, sans devoir recommencer de zéro. Il lui suffit alors de modifier la copie obtenue.

### La suppression d’un formulaire
Dans la page d’accueil, chaque formulaire créé peut être supprimé en cliquant sur le bouton “Supprimer” correspondant.

Un pop-up s’affiche alors, demandant à l’utilisateur s’il est certain de vouloir supprimer le formulaire, tout en l’informant que les réponses associées seront également supprimées.

Si l’utilisateur confirme son choix, le formulaire, ainsi que toutes ses réponses, seront définitivement supprimés.

## L'intégration avec Tobii Pro Lab
Dans la page de Tobii Pro Lab visible dans la capture d’écran ci-après, l’expérimentateur peut préparer un scénario d’expérimentation à faire passer à différents participants.
Ce scénario peut inclure des visites à la plateforme que nous avons développée, afin de recueillir les réponses des participants à certaines questions, par exemple après l’exposition à un stimulus.

Comme illustré dans la figure, l’expérimentateur a préparé un scénario comprenant une première visite à la plateforme, un stimulus sous forme d’image, puis une seconde visite à la plateforme.

À droite de la page, lorsqu’une des visites à notre plateforme est sélectionnée, un champ de texte intitulé “URL” apparaît. C’est dans ce champ que l’on saisit l’URL menant à la page du formulaire à remplir à cette étape du scénario.
 On remarque que l’URL se termine par l’ID du participant, ici “Kevin”. Il aurait également été possible d’utiliser le symbole @ à la place de l’ID pour accéder au formulaire en tant que participant par défaut, comme expliqué précédemment.

On peut aussi remarquer qu’il est possible de définir une durée limite à chaque étape, au terme de laquelle Tobii passe automatiquement au stimulus suivant. On peut également appuyer sur la touche F10 pour passer manuellement au stimulus suivant sans attendre la fin du compte à rebours.

 ![alt text](<Guide Images/UI16.JPG>)

Après avoir préparé un scénario d’expérimentation, l’expérimentateur saisit les noms (considérés comme identifiants) des participants, puis clique sur “Start Recording” pour lancer l’expérimentation et commencer l’enregistrement de ce qui se passe à l’écran.

Comme le montre la capture d’écran suivante, le participant nommé Kevin a été ajouté.

![alt text](<Guide Images/UI15.JPG>)

Dans la capture d’écran suivante, on trouve la page de Tobii Pro Lab contenant les enregistrements d’écran (Recordings) effectués lors du passage des participants par le scénario d’expérimentation.

![alt text](<Guide Images/UI14.JPG>)

## Scénarios d'utilisation
Vous trouverez ci-après des descriptions textuelles de l’ensemble des scénarios d’utilisation de notre plateforme : 

#### 1/ Créer un formulaire : 
<img src="Guide Images/sce.JPG" width="450"/>

#### 2/ Modifier un formulaire : 
<img src="Guide Images/sce2.JPG" width="450"/>

#### 3/ Supprimer un formulaire : 
<img src="Guide Images/sce3.JPG" width="450"/>

#### 4/ Dupliquer un formulaire : 
<img src="Guide Images/sce4.JPG" width="450"/>

#### 5/ Consulter un formulaire : 
<img src="Guide Images/sce5.JPG" width="450"/>

#### 6/ Consulter les réponses des participants à un formulaire : 
<img src="Guide Images/sce6.JPG" width="450"/>

#### 7/ Remplir un formulaire : 
<img src="Guide Images/sce7.JPG" width="450"/>

#### 8/ Définir un id participant par défaut : 
<img src="Guide Images/sce8.JPG" width="450"/>