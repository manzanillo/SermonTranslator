# Zermon

A sermon streaming service that translates spoken turkish into german/english.

## Features

- Real-time speech recognition in Turkish
- Automatic translation to German and English
- Web-based interface for easy access
- Live updates via WebSocket

## Tech Stack

- **Frontend**: Next.js with App Router (Port 5173)
- **Backend**: Express.js with Socket.IO (Port 3001)
- **Translation Service**: LibreTranslate API
- **Speech Recognition**: Web Speech API
- **Design System**: Figma

## Note

This application uses the browser's Web Speech API, which requires microphone access and is supported in modern browsers like Chrome and Edge.

## Braucht eure App SSR/Next.js – oder wäre Vite eigentlich besser geeignet? Begründet anhand von SEO und Interaktivität.

Klar CSR, da Websockets für meine Anwendung wichtig sind und diese besser mit CSR funktionieren. Die SEO ist hierbei zweitrangig, da es sich ohnehin bereits um ein nischiges Produkt handelt, welches somit besser konkurriert.

## Welche Ressourcen hat die App?

/register, /login, /logout, /me, /change-password, /users, /sessions, /translations, /forums, 

Hierarchie: /InputTurkish can only be accessed from the /Imam, who is also the only one who can start a /session
            /Translations can only be viewed by the /Listener, who can participate in a session

Strukturentscheidung: "Flaches Design mit Query-Parametern", da meine App wenige Daten handelt, sondern der meiste Traffic in Echtzeit passiert.

## Welche Daten in eurer App müssten in der Datenbank liegen – und gibt es Daten, für die Redis oder ein Cloud Object Store (S3) langfristig sinnvoller wären? Begründet in 2–3 Sätzen.

In der Datenbank müssten Userinformationen liegen, da sich diese für eine Datenbank gut eignen. Da meine App viel auf Echtzeit-Traffic basiert, kann man diese Daten auch auf dem Cache speichern, obwohl ich auch überlege, Predigen zu speichern, diese müssten dann ebenfalls in einer Datenbank angelegt sein.

## Welche drei Dinge kann ein anonymer Nutzer mit eurer aktuellen API anstellen, die er nicht dürfte?

1. In dem GET api/users -Protokoll bekommt er alle User angezeigt, was Datenschutztechnisch schwierig wäre.
2. In dem GET api/sessions/:id Protokoll kann er einfach alle IDs durchtesten und somit sich durch Sessions surfen, zu denen er möglicherweise gar keinen Zugriff hat.
3. In dem DELETE api/translations/:id kann er einfach willkürlich Übersetzungen löschen.

## Was passiert, wenn jemand versuchen würde, den JWT-Payload manuell verändert (z.B. die userId auf eine fremde ändert)? Warum funktioniert das nicht?

Wenn Der Angreifer den Payload ändert, stimmt sie nicht mehr mit dem Token überein, da mit verändertem Inhalt (id) eine andere Signatur rauskommen würde und diese abgelehnt werden würde.

## Security Audit: 06-05-2026

Die App hat noch Broken Access Control issues hinsichtlich fehlender Authentifizierung, fehlender Berechtigungseinschränkungen und öffentliche Datenschutzdaten. Zu dem gibt es noch keine passwort strength validation oder rate limiting.

## Test Pyramide
Ebene-Was testen wir?-Tool

Unit-Textverarbeitung-Vitest
Integration-Session-path testen-Vitest
E2E-Login-Flow, Session start/participate-Cypress

Welche zwei Dinge würde am meisten Schaden, wenn es durch den Agenten kaputt geht?
      -Session erstellen und dass man Sessions beitreten kann.
