"use client";

import { useEffect, useRef, useState } from "react";
import { categories, type MenuCategory } from "@/data/menuItems";
import styles from "./CategoryTabs.module.css";

/**
 * Tepada yopishib turadigan (sticky) toifalar paneli. Tugma bosilganda
 * tegishli bo'limga silliq scroll qiladi; qo'lda scroll qilish ham
 * odatdagidek ishlayveradi — bu faqat qo'shimcha tezkor navigatsiya.
 */
export function CategoryTabs() {
  const [active, setActive] = useState(categories[0]?.id);
  // Panel tepaga yopishib qolganini bildiradi — faqat shunda ustidagi
  // "parda" yoqiladi (aks holda u header va bannerlarni yopib qo'yadi).
  const [stuck, setStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting));
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sections = categories
      .map((category) => document.getElementById(category.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        if (visible?.target.id) {
          setActive(visible.target.id as MenuCategory);
        }
      },
      { rootMargin: "-140px 0px -70% 0px", threshold: 0 }
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" />
      <div className={`${styles.stickyWrap} ${stuck ? styles.stuck : ""}`}>
        <nav className={styles.tabs}>
          {categories.map((category) => {
            const classNames = [
              styles.tab,
              category.accent === "blue" ? styles.blue : "",
              active === category.id ? styles.active : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                key={category.id}
                type="button"
                className={classNames}
                onClick={() => handleClick(category.id)}
              >
                {category.label}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
