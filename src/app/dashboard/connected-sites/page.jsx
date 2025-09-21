"use client"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import {
  TextureCard,
  TextureCardContent,
  TextureCardHeader,
  TextureCardTitle,
} from "@/components/ui/texture-card";

// Example data - replace with real data later
const exampleSites = [
  {
    id: 1, name: "Roobet", accentColor: "#ffaa00", icon: "/casinos/roobet.svg",
  },
  {
    id: 2, name: "Gamdom", accentColor: "#03FF87", icon: "/casinos/gamdom.svg", iconClass: "scale-[.8]"
  },
  {
    id: 3, name: "Shuffle", accentColor:"#896CFF", icon:"/casinos/shuffle.svg", iconClass:"scale-[.8]"
  },
  {
    id: 4, name: "Rain.GG", accentColor:"#F6AF16", icon:"/casinos/rain.svg", iconClass:"scale-[.9]"
  },
  {
    id: 5, name: "Rustclash", accentColor:"#A252DF", icon:"/casinos/rustclash.svg", iconClass:"scale-[.9]"
  },


];

export default function Page() {
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Connected Sites</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-2 p-6 pt-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Connected Sites
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {exampleSites.length} sites connected
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {exampleSites.map((site) => (
            <TextureCard
              key={site.id}
              className="flex flex-col text-white"
              style={{ '--accent': site.accentColor }}
              onClick={() => alert(site.name)}
            >
              <TextureCardContent className="text-white overflow-hidden relative">
                <div className="relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-md bg-white/[0.025] border border-white/10 flex items-center justify-center relative p-2.5 overflow-hidden">
                      <img className={`z-10 drop-shadow ${site?.iconClass}`} src={site.icon} />
                      <img className="absolute scale-[3] blur-[50px] z-0" src={site.icon} />
                    </div>

                    <p>{site.name}</p>

                  </div>

                  <br />
                  <Switch
                    checked
                    className="data-[state=checked]:bg-[var(--accent)] data-[state=checked]:fill-white"
                  />
                </div>
                <div style={{backgroundColor:site.accentColor}} className="absolute size-20 z-0 opacity-40  top-0 left-0 blur-[100px]"/>
              </TextureCardContent>
            </TextureCard>

          ))}
        </div>
      </div>
    </SidebarInset>
  );
}
