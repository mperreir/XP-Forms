
# Guide d'utilisation

## Le Frontend

La plateforme que nous avons implémentée est composée de différentes pages, chacune permettant d’effectuer des tâches spécifiques et destinée à un acteur particulier.


### Page d'accueil
Il s’agit de la première page qui s’affiche lorsque l’expérimentateur accède à la plateforme.

#### Liste des formulaires
Pour chaque formulaire, on peut voir : son titre, sa date et heure de création, la date et heure de la dernière modification, le groupe auquel il appartient, ainsi qu'un menu avec plusieurs actions possibles :
- Voir : accéder à la page de consultation du formulaire
- Modifier : accéder à la page de modification (si le formulaire n’a pas encore de réponses)
- Voir réponses : accéder à la liste des réponses des participants
- Déplacer : déplacer le formulaire dans un autre groupe
- Dupliquer : créer une copie du formulaire
- Supprimer : supprimer le formulaire
- Exporter : exporter le json du formulaire dans un dossier zip
- Exporter les données en csv : exporter les réponses su formulaire dans un csv
- Supprimer les réponses : supprimer l'ensemble des réponses du formulaire
On peut également filtrer l’affichage des formulaires par groupe ou alors rechercher un formulaire via son titre.

#### Gestion des groupes
La page d’accueil affiche la liste des groupes de formulaires existants. Chaque groupe permet de regrouper des formulaires par projet ou par catégorie. Il est possible de :
- Créer un nouveau groupe
- Renommer ou supprimer un groupe
- Voir le nombre de formulaires dans chaque groupe

#### Actions multiples 
Il est possible de cocher plusieurs formulaires / plusieurs groupes afin d'effectuer une même action sur l'ensemble des formulaires / groupes séléctionnés via le bouton "Actions". 
Pour les formulaires, les actions multiples possibles sont : déplacer, dupliquer, supprimer, exporter, exporter les données en csv, exporter les réponses su formulaire dans un csv, supprimer les réponses.
Pour les groupes, la seule action multiple disponible est supprimer.

#### Paramètres globaux
Un champ de texte permet de saisir l’id du participant par défaut. Cet ID sera ajouté dynamiquement à l’URL d’accès d’un formulaire si celui-ci contient le symbole-clé @ à la place de l’ID du participant. Cela facilite l’association automatique des réponses à un participant lors de tests en série.

#### Import de formulaires
Un bouton permet d’importer un ou plusieurs formulaires à partir d’un dossier zip contenant des formulaires format json. 

![Accueil de la plateforme](<Guide Images/Accueil.png>)
#### Exemple de création d’un groupe
![Création d’un groupe](<Guide Images/Nouveau_groupe.png>)
#### Déplacement d’un formulaire dans un groupe
![Déplacement d’un formulaire](<Guide Images/Deplacer_dans_un_groupe.png>)
#### Import d’un formulaire
![Import d’un formulaire](<Guide Images/Import.png>)
#### Export d’un formulaire
![Export d’un formulaire](<Guide Images/Export.png>)
#### Filtrage par groupe
![Sélection d’un groupe](<Guide Images/Selection_groupe.png>)
### Gestion des groupes de formulaires

La gestion des groupes se fait principalement depuis la page d’accueil. Pour créer un groupe, cliquez sur le bouton “Nouveau groupe”. Pour renommer ou supprimer un groupe, utilisez les options du menu associé à chaque groupe. Pour déplacer un formulaire dans un groupe, utilisez le bouton “Déplacer” puis séléctionnez le groupe que vous souhaitez.

### Import/export de formulaires

Pour importer un formulaire, cliquez sur le bouton “Importer” et sélectionnez un dossier zip contenant des formulaires au format JSON compatible. Pour exporter un formulaire, utilisez le bouton “Exporter” associé à chaque formulaire : vous pouvez choisir d’exporter uniquement la structure ou d’inclure les réponses.

### La page de création et de modification de formulaires

La page de création de formulaires permet de construire un formulaire en ajoutant les composants (ou widgets) nécessaires. Elle est composée de trois parties :
* À gauche, on trouve les différents composants pouvant être ajoutés au formulaire, en les faisant glisser vers la zone centrale.
* Au centre gauche, se trouve le formulaire en cours de création.
* Au centre droit, sont affichés des paramètres spécifiques permettant de modifier le comportement et les propriétés du composant sélectionné (ou du formulaire en général si aucun composant n’est sélectionné), tels que l’affichage conditionnel, les règles de validation, le caractère obligatoire d’une réponse, ou encore le style du formulaire.
* À droite, le panneau permettant d'ajouter des styles sur les différents composants.

#### Personnalisation du style (CSS) des formulaires
Il est possible d’ajouter du code CSS personnalisé pour modifier l’apparence du formulaire (couleurs, marges, polices, etc.) et l’adapter à vos besoins ou à la charte graphique de votre projet. Un champ dédié à la saisie du CSS est disponible dans la colonne de droite (paramètres du formulaire). Les styles s'appliquent initialement sur le composant entier. Afin de personnaliser le titre (pour tous les composants) ou les options (uniquement pour les composants checkbox group et radio group), ajouter "label." ou "option." devant le style. 

Exemple d’interface pour la personnalisation du style :
![Personnalisation du style](<Guide Images/creation.png>)

#### Création d'un formulaire

Nous avons utilisé la librairie Form.js pour implémenter cette fonctionnalité. Grâce à son système de Drag and Drop, elle rend la création de formulaires plus simple et intuitive pour les expérimentateurs. Elle permet également de modifier la position des widgets sur la page du formulaire ainsi que l’espace qu’ils occupent, offrant ainsi une grande liberté en matière de mise en page.

Form.js propose une large panoplie de composants, notamment des champs de texte, d’images, de dates, des cases à cocher (checkbox), des boutons radio, des listes déroulantes, et bien plus encore. Même si certains widgets nécessaires ne sont pas inclus par défaut, il est possible de les définir et de les rendre disponibles à l’utilisateur final.

Nous avons également ajouté la possibilité pour l’expérimentateur de saisir un titre pour le formulaire, à l’aide d’un champ de texte situé en haut de la page.

Enfin, pour créer un formulaire composé de plusieurs pages (formulaire multipage), il suffit d’ajouter le composant appelé "separator". Comme son nom l’indique, ce composant permet de séparer les différentes pages d’un même formulaire. Dans l’image ci-après de la page de création de formulaires, le séparateur est représenté par une ligne horizontale grise qui divise visuellement deux pages du formulaire. Lors de la consultation du formulaire, chaque page sera alors affichée séparément.

![alt text](<Guide Images/multipages.JPG>)

Dans l’image suivante, on peut voir que lorsqu’un composant du formulaire est sélectionné, il est possible de le supprimer ou de le dupliquer via les boutons situés sur le bord droit du composant. À droite de ce dernier, apparaissent les paramètres spécifiques à ce composant, que l’on peut modifier.

![alt text](<Guide Images/param_composant.png>)

### La page de modification de formulaires
On accède à cette page lorsqu’on choisit de modifier un formulaire. Elle présente le formulaire sélectionné et offre la possibilité d’apporter toute modification souhaitée à ce dernier.

`Remarque :` si un formulaire a déjà été rempli par un participant, il devient impossible de le modifier.

La figure ci-après est une capture d’écran de la page de modification de formulaires.

![alt text](<Guide Images/page_modif.png>)

### La page de consultation de formulaires (vue de l’expérimentateur)

Une bande d’information est affichée en haut de la page de consultation du formulaire. Elle indique le contexte d’utilisation (expérimentateur ou participant), l’URL à utiliser pour accéder à la page, et peut afficher des instructions spécifiques ou des informations sur la navigation.

L’URL de consultation du formulaire inclut le numéro de la page courante et le nombre total de pages, par exemple :
```
http://localhost:3000/form-viewer/ID_du_formulaire/numéro_de_la_page/ID_participant
```

La bande d’information affiche également des instructions détaillées pour l’intégration avec Tobii :

Pour intégrer dans un scénario Tobii, utilisez :
```
http://localhost:3000/form-viewer/Form_11x9t4d/1/id_participant
```
Ajoutez `@` comme ID participant pour utiliser l’ID utilisateur par défaut.

Ajoutez `/début-fin` entre le numéro de page et l’ID participant pour parcourir un intervalle de pages. Exemple : `/2-4/id`

Ajoutez `?navigation=True` à la fin si vous voulez permettre la navigation entre pages.

La bande affiche aussi : “Page X sur Y”, où X est la page actuelle et Y le nombre total de pages du formulaire, pour faciliter la navigation et le suivi du remplissage.

Dans cette page, l’expérimentateur peut consulter un formulaire. En haut de la page, des instructions lui indiquent quelle URL saisir dans Tobii Pro Lab pour que le participant soit dirigé vers la page correspondante du formulaire, dans le cadre d’un scénario d’expérimentation (voir l’explication de l’utilisation des URLs pour la navigation entre notre plateforme et Tobii Pro Lab ici). 

On peut également remarquer la présence des boutons “Page suivante” et “Page précédente”, permettant de naviguer d’une page à l’autre dans le cas d’un formulaire multipage.

Cette page présente deux vues :
* Une vue pour l’expérimentateur, accessible via une URL de la forme :
 http://localhost:3000/form-viewer/ID_du_formulaire/numéro_de_la_page
* Une vue pour le participant, qui est amené à remplir le formulaire, accessible via une URL de la forme :
http://localhost:3000/form-viewer/ID_du_formulaire/numéro_de_la_page/ID_du_participant
 
Les figures suivantes présentent la vue de l’expérimentateur de la page de consultation de formulaires et les informations contenues dans le bouton "+".

![alt text](<Guide Images/vue_exp.png>)

![alt text](<Guide Images/url_form.png>)

### La page de consultation de formulaires (vue du participant)
Dans cette vue, le participant est amené à remplir le formulaire affiché, ou une page spécifique de celui-ci.

Grâce à la fonctionnalité de sauvegarde automatique, les réponses saisies par le participant sont enregistrées au fur et à mesure du remplissage, plus précisément à chaque fois qu’un champ est modifié (événement onchange). Cela garantit qu’aucune réponse ne sera perdue en cas de panne ou d’imprévu.

Comme on peut le voir dans les deux figures ci-après, lorsqu’on accède à la page via une URL de la forme :
http://localhost:3000/form-viewer/ID_du_formulaire/numéro_de_la_page/ID_du_participant?navigation=True
le participant a la possibilité de naviguer entre les pages du formulaire.

En revanche, si l’on retire le paramètre ?navigation=True de l’URL, la navigation devient impossible. Cela est utile si l’on souhaite que le participant remplisse différentes pages du formulaire à des moments distincts de l’expérimentation.

##### Page de consultation de formulaires, vue du participant, (avec option de navigation)
![alt text](<Guide Images/with_nav.png>)

##### Page de consultation de formulaires, vue du participant, (sans option de navigation)
![alt text](<Guide Images/without_nav.png>)

### La page de consultation des réponses à un formulaire
Dans cette page, on trouve un tableau contenant les réponses des participants ayant rempli le formulaire concerné. Chaque colonne représente une question du formulaire et chaque ligne correspond aux réponses d’un participant (identifié par son ID).

On y trouve un bouton permettant de télécharger le tableau au format CSV, ainsi qu’un bouton “Supprimer toutes les réponses”, permettant d'effacer toutes les réponses présentes dans le tableau.

Vous pouvez voir dans la figure ci-après une capture d’écran de cette page.

![alt text](<Guide Images/reponses.png>)

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
Vous trouverez ci-après des descriptions textuelles de l’ensemble des scénarios d’utilisation de la plateforme :

#### 1/ Créer un formulaire
<img src="Guide Images/sce.JPG" width="450"/>

#### 2/ Modifier un formulaire
<img src="Guide Images/sce2.JPG" width="450"/>

#### 3/ Supprimer un formulaire
<img src="Guide Images/sce3.JPG" width="450"/>

#### 4/ Dupliquer un formulaire
<img src="Guide Images/sce4.JPG" width="450"/>

#### 5/ Consulter un formulaire
<img src="Guide Images/sce5.JPG" width="450"/>

#### 6/ Consulter les réponses des participants à un formulaire
<img src="Guide Images/sce6.JPG" width="450"/>

#### 7/ Remplir un formulaire
<img src="Guide Images/sce7.JPG" width="450"/>

#### 8/ Définir un id participant par défaut
<img src="Guide Images/sce8.JPG" width="450"/>

#### 9/ Créer un groupe de formulaires
*Depuis la page d’accueil, cliquez sur “Nouveau groupe”, donnez un nom, validez. Le groupe apparaît dans la liste.*

#### 10/ Déplacer un formulaire dans un groupe
*Utilisez le bouton “Déplacer” ou faites glisser le formulaire vers le groupe souhaité.*

#### 11/ Supprimer ou renommer un groupe
*Utilisez le menu d’options du groupe pour le renommer ou le supprimer. Les formulaires du groupe supprimé sont déplacés dans “Sans groupe” (si cette option existe).*

#### 12/ Importer un formulaire
*Cliquez sur “Importer”, sélectionnez le fichier JSON du formulaire à ajouter. Le formulaire apparaît dans la liste.*

#### 13/ Exporter un formulaire
*Cliquez sur “Exporter” à côté du formulaire, choisissez d’exporter la structure seule ou avec les réponses. Un fichier est téléchargé.*