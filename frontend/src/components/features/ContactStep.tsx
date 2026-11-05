"use client";

import { useState } from "react";
import { useCustomerStore } from "@/store/customerStore";
import styles from "./ContactStep.module.css";

/**
 * Checkout'da bir marta ko'rsatiladigan blok — mijoz ismini va telefon
 * raqamini qo'lda kiritadi (SMS kod shart emas). Ikkalasi ham saqlangach, keyingi buyurtmalarda bu blok umuman
 * ko'rinmaydi (customerStore'da saqlanadi).
 */
export function ContactStep() {
  const { name, phone, setName, setPhone } = useCustomerStore();
  const [nameInput, setNameInput] = useState(name);
  const [phoneInput, setPhoneInput] = useState(phone);

  if (name.trim() && phone.trim()) return null;

  const canSave = nameInput.trim().length > 0 && phoneInput.trim().length >= 7;

  const handleSave = () => {
    if (!canSave) return;
    setName(nameInput.trim());
    setPhone(phoneInput.trim());
  };

  return (
    <div className={styles.card}>
      <p className={styles.title}>Контакт для связи по заказу</p>

      <input
        type="text"
        className={styles.input}
        placeholder="Ваше имя"
        value={nameInput}
        onChange={(e) => setNameInput(e.target.value)}
      />

      <input
        type="tel"
        className={styles.input}
        placeholder="Номер телефона"
        value={phoneInput}
        onChange={(e) => setPhoneInput(e.target.value)}
      />

      <button
        type="button"
        className={styles.saveBtn}
        onClick={handleSave}
        disabled={!canSave}
      >
        Сохранить
      </button>
    </div>
  );
}
