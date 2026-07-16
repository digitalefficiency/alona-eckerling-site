import { StoryPanel } from "@/components/media/StoryPanel";

// Homepage firm-story panel — a thin wrapper over the reusable StoryPanel.
export function OurStory() {
  return (
    <StoryPanel
      kicker="OUR STORY"
      image="/media/building/stage-6.webp"
      alt="מגדל מגורים מודרני בהרצליה בשעת בין הערביים"
      cta={{ label: "קראו עוד עלינו", href: "/about" }}
    >
      <p>
        משרד ברזילי הוא <strong className="font-bold text-white">שלושה דורות</strong> של שמאות מקרקעין — מאז ששרונה ברזילי ייסדה אותו בשנת 1987.
      </p>
      <p>
        אנחנו משלבים <strong className="font-bold text-white">סמכות אקדמית נדירה</strong> — דוקטור למקרקעין ושמאי מכריע — עם ליווי אישי וזמינות גבוהה, מתוך מטרה למצות את מלוא הזכויות של כל לקוח.
      </p>
      <p>
        <strong className="font-bold text-white">לא „מפעל שומות”.</strong> כל תיק נבדק לעומק, בידיים של משרד שמכיר את התחום מבפנים — דור אחר דור.
      </p>
    </StoryPanel>
  );
}
