# KI-Kontext (vor jedem Prompt lesen)

## Zweck
- Stelle sicher, dass jede Ausgabe die inszenierte Dark-Fantasy-Abholung für Alex (JGA) weiterführt. Die Website ist das Tor nach dem geheimen Brief auf seinem Balkon; sie setzt denselben Ton, dieselbe Symbolik und würdige Schwere fort.

## Welt & Dramaturgie
- Freitagvormittag: Alex findet einen feierlich wirkenden Brief plus Gewandung („Gilgenkluft“, Hut, Kette) auf dem Balkon. Der Brief ruft ihn als Auserwählten, die Welt ist bedroht, nur er kann den Weg antreten.
- QR-Code im/auf dem Brief führt zur Website. Website = „Der Durchlass“, ein ritueller Zugangstest, kein Tech-Login.
- Tonalität: ernst, düster, schicksalhaft, Elden-Ring-/FromSoftware-Anmutung. Sprache kurz, schwer, markant; würdevoll statt ironisch. Leicht derbe Gruppentöne ok, aber Grundton bleibt feierlich.

## Visuelle & Audio-Leitplanken
- Dark Fantasy: sehr dunkler Hintergrund; Gold/Schwarzgold/Bronze/Patina; Runen, Siegel, Reliefs, Embleme; verfluchte oder sakrale Metalloptik; hochwertige Game-UI-Anmutung.
- Zentrales Emblem/Siegel als Zugangssymbol für „Der Durchlass“. Gefühl eines alten Tores oder Siegels.
- Keine moderne App-Optik, kein CAPTCHA-/Login-Look, keine bunte Rätsel-UI.
- Audio erwünscht: rauchige Erzählerstimme möglich; metallische Auswahl-/Bestätigungssounds; sakrale Klickgeräusche; filmreife Vertonung.

## Aktuelle Site-Struktur (Stand Repository)
- Start: „Vorsiegel der Gilde“ – Nameingabe (gültig: „alexander luther“, „alex luther“) schaltet weiter.
- Intro: „Brief der Gilde“ – Text bindet den Balkonfund (Brief + Gewandung) direkt an den digitalen Durchlass und führt zur Prüfung.
- Prüfung: „Die Siegel der Unbeugsamen“ (Sigillationskreis-Puzzle, graphisches Knoten-Board). Feedback-Text und Audio-Visualizer aktiv. Ziel: alle Knoten entzünden.
- Erfolg: „Einlass gewährt“ – Koordinaten werden gezeigt (`51.072043, 13.756919`) und der Übergang von Brief/Gewandung zum realen Sammelpunkt wird betont.
- Zweites Siegel: Wissensfrage vor der letzten Weisung; nach dem Schwur bleibt der Nutzer auf der Website und landet in „Verbotene Kunde“, statt auf einem externen Gag.
- Assets: `musik.mp3` (Loop), `chooseelement.mp3`, `buttonnextpage.mp3`, `reveal.mp3`; WebAudio-Visualizer im Canvas; Schriften Cinzel & Cormorant Garamond.

## Abgleich Website ↔ Story
- Die Website funktioniert am stärksten, wenn sie wie die direkte Fortsetzung des Briefes wirkt: QR-Code scannen, Name beweisen, Sigillationskreis bestehen, Koordinaten empfangen, letzte Weisung für den Aufbruch lesen.
- Texte sollen Alex nie wie einen normalen Website-Besucher behandeln, sondern wie einen bereits Berufenen, der nur noch durch das digitale Tor schreitet.
- Der digitale Part sollte keine ironische Ausbruchsstelle haben; auch Feedback- und Abschluss-Texte bleiben würdevoll, düster und bündig.

## Ideale Einbindung in die Storyline
- Der Brief auf dem Balkon ist der Prolog. Er enthält QR-Code, Gewandung und erste Prophezeiung.
- Die Website ist Akt I: der Beweis, dass Alex dem Ruf folgt. Jeder Screen bestätigt einen Schritt der Geschichte: Identität → Prüfung → Offenbarung → Marschbefehl.
- Die Koordinaten-Seite ist der Übergang in die reale Welt. Dort muss klar werden, dass Alex jetzt die Gewandung anlegt, den Brief mitnimmt und zum Treffpunkt zieht.
- „Verbotene Kunde“ ist kein Witz- oder Link-Out, sondern die letzte in-world Weisung vor dem echten Tagesprogramm. So bleibt die Immersion bis zum physischen Treffen ungebrochen.

## Leitideen für neue Prompts/Änderungen
- Website = direkte Fortsetzung des physischen Briefs; dieselbe Stimme und Symbolik.
- „Der Durchlass“ als rituelles Tor/Urteil inszenieren, nicht als technischer Test.
- Prüflogik eher sakraler Zugang (Schwelle, Siegel, Torritual) als Puzzle-Gag. Fake-CAPTCHA ist verworfen.
- Ergebnis nach bestandener Schwelle: reale Spur/Koordinaten/Treffpunkt (aktuell Tischtennis-Platten-Koordinaten). Präsentation als feierliche Offenbarung oder Freigabe.
- Immer: dunkel, episch, geheimnisvoll, würdevoll, leicht pathetisch; keine Albernheit, keine moderne UI-Anmutung.

## Do / Don’t
- DO: betone Bedrohung der Welt, Auserwähltheit von Alex, Notwendigkeit der Gewandung; arbeite mit Siegeln, Toren, Schwellen, Runen, Metallglanz, Patina.
- DO: nutze kurze, schlagende Sätze mit mittelalterlich-filmreifem Duktus.
- DO: halte Audio und haptische UI-Sounds bedeutungsvoll-rituell.
- DON’T: CAPTCHA-Optik, ironische Tech-Sprache, moderne Login-/Formularästhetik, bunte Rätsel-UI.

## Quick Facts für die KI
- Name des Rituals/Tests: „Der Durchlass“ (erste Prüfung).
- Story-Ort jetzt: digitale Schwelle vor dem eigentlichen Tagesprogramm.
- Nächster Hinweis (aktuell): Koordinaten 51.072043, 13.756919 → Treffpunkt nach bestandener Prüfung.
- Spieler: Alex (Auserwählter), Rufname auch „Alexander Luther“.

## Wartungspflicht für die ausführende KI
- Lies diese Datei vor jedem Prompt, wenn möglich.
- Halte sie aktuell, sobald Story, Assets, Texte oder Prüfungslogik sich ändern.
- Trage neue Koordinaten/Hinweise sofort ein, damit Folge-Prompts konsistent bleiben.
