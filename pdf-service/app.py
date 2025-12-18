from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML
import qrcode
import base64
import json
import io
import os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
STATIC_DIR = os.path.join(BASE_DIR, "static")

env = Environment(
    loader=FileSystemLoader(TEMPLATES_DIR),
    autoescape=select_autoescape(["html", "xml"]),
)

app = FastAPI(title="Mat'inma PDF Service")

# Servir les assets statiques (images du ticket)
if os.path.isdir(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.post("/generate-ticket")
async def generate_ticket(ticket: dict):
    """Génère un ticket PDF à partir d'un JSON de ticket.

    Le payload attendu est grosso modo le `ticketJson` construit côté Node :
    {
      "ticket_number": str,
      "commande_id": int,
      "commande_numero": str,
      "created_at": str / ISO,
      "statut_commande": str,
      "type_commande": str,
      "numero_table": str | int | null,
      "total": number,
      "paiement": {"methode": str, "statut": str},
      "lignes": [
        {"quantite": int, "nomPlat": str, "commentaire": str|null,
         "prixUnitaire": number, "totalLigne": number}
      ]
    }
    """
    try:
        template = env.get_template("ticket.html")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Template introuvable: {e}")

    # Normalisation des données + formatage date/heure
    created_at = ticket.get("created_at")
    try:
        # accepter soit ISO string, soit timestamp
        if isinstance(created_at, (int, float)):
            dt = datetime.fromtimestamp(created_at / 1000 if created_at > 1e12 else created_at)
        else:
            dt = datetime.fromisoformat(created_at.replace("Z", "+00:00")) if created_at else datetime.now()
    except Exception:
        dt = datetime.now()

    date_str = dt.strftime("%d-%m-%Y")
    time_str = dt.strftime("%H:%M:%S")

    lignes = ticket.get("lignes") or []

    # Normalisation des libellés pour l'affichage
    paiement_raw = (ticket.get("paiement") or {}).get("methode") or "-"
    paiement_lower = str(paiement_raw).lower()
    paiement_map = {
        # espèces (valeur par défaut actuelle)
        "espece": "Espèces",
        "especes": "Espèces",
        "cash": "Espèces",
        # futurs moyens de paiement possibles
        "holo": "Holo",
        "mvula": "Mvula",
    }
    paiement_label = paiement_map.get(paiement_lower, paiement_raw if paiement_raw == "-" else paiement_raw.capitalize())

    type_raw = ticket.get("type_commande") or "-"
    type_lower = str(type_raw).lower()
    is_sur_place = type_lower in ("sur_place", "sur place")
    is_emporter = type_lower in ("a_emporter", "emporter", "à emporter")

    if is_sur_place:
        type_label = "Sur place"
    elif is_emporter:
        type_label = "À emporter"
    else:
        # Conserver la casse d'origine si ce n'est pas un des types connus
        type_label = type_raw

    context = {
        "numero_commande": ticket.get("commande_numero") or "-",
        "numero_ticket": ticket.get("ticket_number") or "-",
        "date": date_str,
        "heure": time_str,
        "items": [
            {
                "nom": l.get("nomPlat") or "-",
                "quantite": l.get("quantite") or 0,
                # prix total par ligne
                "prix": round(l.get("totalLigne") or 0),
                # prix unitaire du plat
                "prix_unitaire": round(l.get("prixUnitaire") or 0),
            }
            for l in lignes
        ],
        "total": round(ticket.get("total") or 0),
        "paiement": paiement_label,
        "type_commande": type_label,
        # Si commande à emporter, pas de numéro de table
        "numero_table": ticket.get("numero_table") if is_sur_place else "-",
        # infos fixes
        "adresse": "Moroni Oasis",
        "telephone": "434 00 04 / 434 00 05",
        "site_web": "https://mat-inma.com",
    }

    # Génération d'un QR code simple contenant quelques infos du ticket
    try:
        qr_payload = {
            "ticket_number": ticket.get("ticket_number"),
            "commande_id": ticket.get("commande_id"),
            "total": ticket.get("total"),
        }
        qr = qrcode.QRCode(version=1, box_size=4, border=2)
        qr.add_data(json.dumps(qr_payload))
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        qr_base64 = base64.b64encode(buffer.getvalue()).decode("ascii")
        context["qr_code_data_uri"] = f"data:image/png;base64,{qr_base64}"
    except Exception:
        context["qr_code_data_uri"] = None

    html_content = template.render(**context)

    # Génération PDF avec hauteur dynamique (taille de page en CSS : 80mm x auto)
    try:
        html = HTML(string=html_content, base_url=BASE_DIR)
        pdf_bytes = html.write_pdf()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur génération PDF: {e}")

    pdf_stream = io.BytesIO(pdf_bytes)

    filename = f"ticket-{ticket.get('ticket_number', 'unknown')}.pdf"

    return StreamingResponse(
        pdf_stream,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
