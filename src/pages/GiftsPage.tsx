import GiftListPanel from "@/components/gifts/GiftListPanel";
import { Heart, Sparkles, Users } from "lucide-react";

export default function GiftsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> Dárečky
        </h1>
        <p className="text-sm text-muted-foreground">Wishlisty a nápady na dárky pro ostatní.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GiftListPanel
          title="Barča si přeje…"
          table="gift_wishes"
          groupColumn="owner"
          groupValue="Barča"
          accent="border-t-pink-400"
          icon={<Heart className="h-4 w-4 text-pink-400" />}
        />
        <GiftListPanel
          title="Tadeáš si přeje…"
          table="gift_wishes"
          groupColumn="owner"
          groupValue="Tadeáš"
          accent="border-t-sky-400"
          icon={<Heart className="h-4 w-4 text-sky-400" />}
        />
      </div>

      <GiftListPanel
        title="Nápady na dárky pro ostatní"
        table="gift_ideas"
        groupColumn="recipient"
        showRecipientInput
        accent="border-t-amber-400"
        icon={<Users className="h-4 w-4 text-amber-400" />}
      />
    </div>
  );
}
