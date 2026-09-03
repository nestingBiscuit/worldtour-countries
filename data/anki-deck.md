# Anki Deck Definition

This file provides details on creating the WorldTour Geography Deck from
scratch.

First, create the required note type and then create the parrent deck.
Import countries.anki.csv, select the new note type and deck.

## Note Type

In Anki, under Tools | Manage Note Types... create a new note type

Fields

- Name
- Code
- Description
- Capital
- Flag
- Map
- Region

## Card types

There are 5 different card types:

- Capital
- Capital reverse
- Flag
- Map
- Map reverse

### Style

All the cards use the same style.
Styling:

```
.card {
    font-family: arial;
    font-size: 30px;
    text-align: center;
    color: black;
    max-width: 1024px;
    overflow-y: scroll;
    position: relative;
    height: 100%;
    margin: 0 auto;
    padding: 0; 
}
.contain {
    margin: 16px;
    height: 80%;
}

.map { max-width: 1024px; height: auto; margin: 0 auto; position: relative; }
.map img { max-height: 100%; height: auto; display: block; margin: 0 auto; position: relative; object-fit: contain; }

.flag { width: auto; height: auto; max-height: 80%; position: relative; padding: 0 20px; margin: 0 auto; }
.flag img { height: auto; min-width: 70%; max-height: 80%; border: 1px solid black; display: block; margin: 0 auto; object-fit: contain; position: relative; }

.desc { font-size: 16px; line-height: 20px; padding: 0 20px; display: block; margin-top: 16px; }

#answer { height: 20%; }
```

### Card Type Capital

Front Template:

```
<b>{{Capital}}</b> is the capital of...
```

Back Template:

```
{{FrontSide}}

<hr id=answer>

{{Name}}<br />
<span class="desc">{{Description}}</span>
```

### Card Type Capital R

Front Template:

```
The capital of <b>{{Name}}</b> is...
```

Back Template:

```
{{FrontSide}}

<hr id=answer>

{{Capital}}
```

### Card Type Flag

Front Template:

```
<div class="contain">
  <div class="flag">{{Flag}}</div>
</div>
```

Back Template:

```
{{FrontSide}}

<div id="answer">
  <hr>
  {{Name}}<br />
  <span class="desc">{{Description}}</span>
</div>
```

### Card Type Map

Front Template:

```
<div class="contain">
  <div class="map">{{Map}}</div>
</div>
```

Back Template:

```
{{FrontSide}}

<div id="answer">
  <hr>
  {{Name}}<br />
  <span class="desc">{{Description}}</span>
</div>
```

### Card Type Map R

Front Template:

```
<div class="contain">
  <div class="map">{{Region}}</div>
</div>
  <hr>
  Where is <b>{{Name}}</b><br />
  <span class="desc">{{Description}}</span>
```

Back template

```
<div class="contain">
  <div class="map">{{Map}}</div>
</div>

<div id="answer">
  <hr>
  {{Name}}<br />
  <span class="desc">{{Description}}</span>
</div>
```

## Create Decks

Create the following decks. (The "::" will create a nested set). This will
allow users to study the maps, flags and capitals separately or together if
they choose.

- WorldTour Geography Countries
- WorldTour Geography Countries::Capitals
- WorldTour Geography Countries::Flags
- WorldTour Geography Countries::Maps

## Import Data

1. Click "File" -> "Import" and select "countries.anki.csv".
2. Fields are separated by Simicolon
3. Select the correct Node Type and Deck
4. Make sure the check the box "Allow HTML in fields"
5. The table of field mapping should match the fields in the CSV as described above. 1-name, 2-code, etc. The 8th field is "Tags."

Make sure you copy the flag and map files into the Anki collection.media directory.

## Populate the sub decks

Once you have imported the notes you can seperate the cards into sub decks by using the search funtion.

1. In the browse window make sure you toggle to "cards" not "notes".
2. Search for the cards you want to move:
   * card:Capital OR "card:Capital R"
   * card:Flag
   * card:Map OR "card:Map R"
3. Select all the found cards (ctrl/cmd + A)
4. Right click and select "Change deck" and select the appropiate sub deck (WorldTour Geography Countries::Capitals, etc.)

## Filter decks

You can also use the tags to make filter decks based on regions.
For instance:
`"deck:WorldTour Geography Countries::Flags" is:due tag:Europe tag:UN`

To make a deck with all the European flag that are UN members.

Read more in [the anki docs](docs.ankiweb.net/filtered-decks.html)
