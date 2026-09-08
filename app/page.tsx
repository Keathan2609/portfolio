import { Opening } from "@/components/sections/Opening";
import { Hero } from "@/components/sections/Hero";
import { Intro } from "@/components/sections/Intro";
import { DisciplineWorld } from "@/components/sections/DisciplineWorld";
import { TransitionBand } from "@/components/sections/TransitionBand";
import { SkillsArsenal } from "@/components/sections/SkillsArsenal";
import { CurriculumVitae } from "@/components/sections/CurriculumVitae";
import { CurrentlyBuilding } from "@/components/sections/CurrentlyBuilding";
import { BeyondTheCode } from "@/components/sections/BeyondTheCode";
import { HireMe } from "@/components/sections/HireMe";
import { journey } from "@/lib/data/journey";
import { disciplinesById } from "@/lib/data/disciplines";

/**
 * THE JOURNEY.
 *
 * One continuous page, not a set of routes. The five discipline worlds are
 * stages within a single document so they can transition into one another
 * on a shared canvas, rather than reading as five separate websites. Case
 * studies open as an in-page takeover for the same reason.
 *
 * The composition is generated from lib/data/journey.ts, which also drives
 * the navigation rail — so the order of the experience exists in exactly
 * one place and the two can never disagree.
 */
export default function JourneyPage() {
  return (
    <>
      {journey.map((stage) => {
        switch (stage.kind) {
          case "opening":
            return <Opening key={stage.id} />;

          case "hero":
            return <Hero key={stage.id} />;

          case "intro":
            return <Intro key={stage.id} />;

          case "discipline":
            return (
              <DisciplineWorld
                key={stage.id}
                discipline={disciplinesById[stage.discipline!]}
              />
            );

          case "transition":
            return <TransitionBand key={stage.id} kind={stage.transition!} />;

          case "skills":
            return <SkillsArsenal key={stage.id} />;

          case "cv":
            return <CurriculumVitae key={stage.id} />;

          case "building":
            return <CurrentlyBuilding key={stage.id} />;

          case "beyond":
            return <BeyondTheCode key={stage.id} />;

          case "hire":
            return <HireMe key={stage.id} />;

          default:
            return null;
        }
      })}
    </>
  );
}
