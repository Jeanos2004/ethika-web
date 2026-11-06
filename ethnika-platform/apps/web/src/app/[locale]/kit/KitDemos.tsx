"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { Input } from "@/components/ui/Field";

/** Démo de la modale (ouverture, Échap, clic sur le fond, retour du focus). */
export function ModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Ouvrir la modale
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Demander un devis" description="Circuit Fouta Djallon, cascades & sommets">
        <Input label="Nom complet" name="demo-name" autoComplete="off" />
        <Button onClick={() => setOpen(false)}>Fermer</Button>
      </Modal>
    </>
  );
}

/** Démo d'un message inséré à la demande (annoncé par les lecteurs d'écran). */
export function ToastDemo() {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <Button variant="outline" size="sm" className="self-start" onClick={() => setVisible(true)}>
        Afficher un message
      </Button>
      {visible && (
        <Toast title="Demande envoyée" onDismiss={() => setVisible(false)}>
          Réf. ETH-0421
        </Toast>
      )}
    </div>
  );
}
