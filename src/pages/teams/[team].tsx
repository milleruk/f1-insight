import * as cheerio from "cheerio";
import type {
  GetStaticPaths,
  GetStaticPropsContext,
  GetStaticPropsResult,
  InferGetStaticPropsType
} from "next";

import { ActorLayout } from "@layouts/ActorLayout";
import { PageLayout } from "@layouts/PageLayout";

import { Teams } from "@components/Cards";
import { DriverBadge } from "@components/DriverBadge";
import { DriverImage } from "@components/DriverImage";
import { TeamInfoDialog } from "@components/InfoDialog";
import { TeamLineChart } from "@components/LineChart";

import { DRIVER_THAT_NEVER_MISSED_A_RACE } from "@utils/constants";
import { getTeamDrivers } from "@utils/helpers";
import { teamsCorrections } from "@utils/mappings";
import { collectTeamCareerInfoData, getTeamWikiData } from "@utils/scraping";
import {
  getDriverRaceResults,
  getDriverStandings,
  getDrivers,
  getRoundConstructorStandings,
  getTeams
} from "@utils/services";
import { Constructor, ITeamCareerInfo } from "@utils/types/constructor";
import { IDriver } from "@utils/types/driver";
import { ConstructorStanding } from "@utils/types/standings";

interface ITeam {
  name: string;
  drivers: IDriver[];
  standings: ConstructorStanding[];
  races: { round: string; country: string }[];
  teamCareerInfo: ITeamCareerInfo;
}

interface IDriverIdentity {
  driver: IDriver;
}

const DriverIdentity = ({ driver }: IDriverIdentity) => (
  <div className="absolute left-1/2 bottom-10 z-20 flex -translate-x-1/2 flex-col items-center gap-4">
    <div className="flex flex-col items-center gap-[2px] text-center text-2xl text-brand-white-100 drop-shadow-card-text-md">
      <h2>{driver.givenName}</h2>
      <h2 className="font-medium uppercase">{driver.familyName}</h2>
    </div>
    <DriverBadge
      permanentNumber={driver.permanentNumber}
      nationality={driver.nationality}
    />
  </div>
);

const Drivers = ({ drivers }: { drivers: IDriver[] }) => {
  return (
    <div
      className={`relative flex sm:h-[300px] md:h-[360px] lg:h-[480px] xl:h-[525px]`}
    >
      {drivers.map((driver) => {
        return (
          <div key={driver.driverId} className="relative">
            <DriverIdentity driver={driver} />
            <DriverImage
              givenName={driver.givenName}
              familyName={driver.familyName}
            />
          </div>
        );
      })}
    </div>
  );
};

const TeamData = ({
  name,
  drivers,
  standings,
  races,
  teamCareerInfo
}: ITeam) => {
  const clean = {
    name: name.toLowerCase().replace(/\s/g, "")
  };

  return (
    <ActorLayout
      actor="team"
      team={clean.name}
      infoDialog={<TeamInfoDialog data={teamCareerInfo} />}
      drivers={<Drivers drivers={drivers} />}
      chart={<TeamLineChart team={name} standings={standings} races={races} />}
    />
  );
};

export default function TeamPage({
  team,
  teams,
  teamStandings,
  teamDrivers,
  races,
  teamCareerInfo
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const name = teamsCorrections[team.name] || team.name;

  return (
    <PageLayout
      headTitle={name}
      title={name}
      side={<Teams teams={teams} />}
      body={
        <TeamData
          name={name}
          drivers={teamDrivers}
          standings={teamStandings}
          races={races}
          teamCareerInfo={teamCareerInfo}
        />
      }
    />
  );
}

export async function getStaticProps(
  context: GetStaticPropsContext<{ team: string }>
): Promise<
  GetStaticPropsResult<{
    teams: Constructor[];
    team: Constructor;
    teamStandings: ConstructorStanding[];
    teamDrivers: IDriver[];
    races: { round: string; country: string }[];
    teamCareerInfo: ITeamCareerInfo;
  }>
> {
  const team = context.params?.team as string;
  const teams = await getTeams();

  const teamData = teams.find(
    (constructor) => constructor.name.toLowerCase() === team.replace(/-/g, " ")
  );

  if (!teamData) {
    return {
      notFound: true
    };
  }

  const driverRaceResults = await getDriverRaceResults(
    DRIVER_THAT_NEVER_MISSED_A_RACE
  );

  const teamStandings = await Promise.all(
    Array.from({ length: driverRaceResults.length }, (_, i) => i + 1).map(
      async (round) =>
        getRoundConstructorStandings(round, teamData.constructorId)
    )
  );

  const drivers = await getDrivers();
  const driverStandings = await getDriverStandings();
  const teamDrivers = getTeamDrivers(
    driverStandings,
    drivers,
    teamsCorrections[teamData.name] || teamData.name
  );

  const teamWikiData = await getTeamWikiData(teamData.url);

  return {
    props: {
      teams,
      team: teamData,
      teamStandings,
      teamDrivers,
      races: driverRaceResults.map((raceResult) => ({
        round: raceResult.round,
        country: raceResult.Circuit.Location.country
      })),
      teamCareerInfo: collectTeamCareerInfoData(teamData, teamWikiData)
    },
    revalidate: 60
  };
}

export const getStaticPaths: GetStaticPaths = async () => {
  const teams = await getTeams();

  return {
    paths: teams.map((team) => ({
      params: {
        team: team.name.toLowerCase().replace(/\s/g, "-")
      }
    })),
    fallback: false
  };
};
