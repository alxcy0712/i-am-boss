import {
  createGameSession,
  performSessionAction,
  selectInitialChoice,
  type GameSession,
  type SessionActionRequest
} from "../game/session";
import { createWebScreenModel, type WebEventCategoryFilter } from "./screen";
import { DEFAULT_WEB_LANGUAGE, resolveWebLanguage, type WebLanguage } from "./i18n";
import "./styles.css";

const CULTURE_ROTATION: SessionActionRequest[] = [
  { id: "change-culture", culture: "adaptive" },
  { id: "change-culture", culture: "wolf" },
  { id: "change-culture", culture: "striver" },
  { id: "change-culture", culture: "laissez-faire" }
];

let session: GameSession = createGameSession({ seed: 1 });
let language: WebLanguage = readInitialLanguage();
let eventCategoryFilter: WebEventCategoryFilter = "all";
const root = getAppRoot();

render();

function render(): void {
  document.documentElement.lang = language;
  const screen = createWebScreenModel(session, { language, eventCategoryFilter });

  root.innerHTML = `
    <main class="shell" data-stage="${screen.stage}">
      <section class="hero">
        <div>
          <p class="eyebrow">${screen.statusBadge}</p>
          <h1>${screen.title}</h1>
          <p class="subtitle">${screen.subtitle}</p>
        </div>
        <div class="hero-tools">
          <div class="language-switch" aria-label="${screen.copy.languageToggleAria}">
            ${screen.languageOptions
              .map(
                (option) => `
                  <button
                    class="language-button ${option.selected ? "is-selected" : ""}"
                    type="button"
                    data-language-id="${option.id}"
                    aria-pressed="${option.selected ? "true" : "false"}"
                  >
                    ${option.label}
                  </button>
                `
              )
              .join("")}
          </div>
          <div class="score-chip">${screen.stageLabel}</div>
        </div>
      </section>

      <section class="startup ${screen.stage === "startup" ? "" : "is-hidden"}">
        ${screen.initialChoices
          .map(
            (choice) => `
              <button class="choice-card" type="button" data-choice-id="${choice.id}">
                <strong>${choice.label}</strong>
                <span>${choice.description}</span>
              </button>
            `
          )
          .join("")}
      </section>

      <section class="dashboard ${screen.stage === "startup" ? "is-hidden" : ""}">
        <div class="stat-grid">
          ${screen.statTiles
            .map(
              (tile) => `
                <article class="stat-tile">
                  <span>${tile.label}</span>
                  <strong>${tile.value}</strong>
                </article>
              `
            )
            .join("")}
        </div>

        <div class="city-layout">
          <div class="city-map" aria-label="${screen.copy.cityMapAria}">
            ${screen.mapTiles.map((tile) => renderMapTile(tile)).join("")}
          </div>

          <aside class="command-panel">
            ${screen.founder ? renderFounderPanel(screen.founder) : ""}
            ${screen.staff ? renderStaffPanel(screen.staff, screen.copy) : ""}
            ${screen.culture ? renderCulturePanel(screen.culture) : ""}
            ${screen.recruitment ? renderRecruitmentPanel(screen.recruitment, screen.copy) : ""}
            ${screen.finance ? renderFinancePanel(screen.finance, screen.copy) : ""}
            <div class="actions">
              ${screen.actions
                .map(
                  (action) => `
                    <button
                      class="action-button"
                      type="button"
                      data-action-id="${action.id}"
                      ${action.enabled ? "" : "disabled"}
                    >
                      ${action.label}
                    </button>
                  `
                )
                .join("")}
            </div>
            ${renderEventFeed(screen)}
          </aside>
        </div>
      </section>
    </main>
  `;

  root.querySelectorAll<HTMLButtonElement>("[data-language-id]").forEach((button) => {
    button.addEventListener("click", () => {
      language = resolveWebLanguage(button.dataset.languageId);
      storeLanguage(language);
      render();
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-event-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextFilter = readEventCategoryFilter(button.dataset.eventFilter);
      if (nextFilter) {
        eventCategoryFilter = nextFilter;
        render();
      }
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-choice-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const choiceId = button.dataset.choiceId;
      if (choiceId) {
        session = selectInitialChoice(session, choiceId);
        render();
      }
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-action-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const actionId = button.dataset.actionId;
      if (actionId) {
        session = performSessionAction(session, createActionRequest(actionId, button)).session;
        render();
      }
    });
  });
}

function renderFounderPanel(
  founder: NonNullable<ReturnType<typeof createWebScreenModel>["founder"]>
): string {
  return `
    <section class="founder-panel" aria-label="${founder.title}">
      <div class="panel-heading">
        <span>${founder.title}</span>
        <strong>${founder.wealth.value}</strong>
      </div>
      <dl class="founder-grid">
        <div>
          <dt>${founder.age.label}</dt>
          <dd>${founder.age.value}</dd>
        </div>
        <div>
          <dt>${founder.health.label}</dt>
          <dd>${founder.health.value}</dd>
        </div>
        <div>
          <dt>${founder.wealth.label}</dt>
          <dd>${founder.wealth.value}</dd>
        </div>
      </dl>
      <div class="ability-grid">
        ${founder.abilityRows
          .map(
            (row) => `
              <div class="ability-row">
                <span>${row.label}</span>
                <strong>${row.value}</strong>
              </div>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderCulturePanel(
  culture: NonNullable<ReturnType<typeof createWebScreenModel>["culture"]>
): string {
  return `
    <section class="culture-panel" aria-label="${culture.title}">
      <div class="panel-heading">
        <span>${culture.title}</span>
        <strong>${culture.currentLabel}</strong>
      </div>
      <div class="culture-options">
        ${culture.options
          .map(
            (option) => `
              <button
                class="culture-option ${option.selected ? "is-selected" : ""}"
                type="button"
                data-action-id="change-culture"
                data-culture="${option.id}"
                ${option.selected ? "disabled" : ""}
              >
                <span class="culture-name">${option.label}</span>
                <span>${culture.pressureLabel}: ${option.pressure}</span>
                <span>${culture.moraleLabel}: ${option.moraleDelta}</span>
                <span>${culture.reputationLabel}: ${option.reputationDelta}</span>
                <span>${culture.resignationRiskLabel}: ${option.projectedAverageResignationRisk}</span>
                <strong>${option.actionLabel}</strong>
              </button>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderStaffPanel(
  staff: NonNullable<ReturnType<typeof createWebScreenModel>["staff"]>,
  copy: ReturnType<typeof createWebScreenModel>["copy"]
): string {
  return `
    <section class="staff-panel" aria-label="${staff.title}">
      <div class="panel-heading">
        <span>${staff.title}</span>
        <strong>${staff.employeeCount.value}</strong>
      </div>
      <dl class="staff-grid">
        <div>
          <dt>${staff.employeeCount.label}</dt>
          <dd>${staff.employeeCount.value}</dd>
        </div>
        <div>
          <dt>${staff.totalMonthlyPayroll.label}</dt>
          <dd>${staff.totalMonthlyPayroll.value}</dd>
        </div>
        <div>
          <dt>${staff.averageEmployeeSalary.label}</dt>
          <dd>${staff.averageEmployeeSalary.value}</dd>
        </div>
      </dl>
      <div class="role-mix">
        ${staff.roleRows
          .map(
            (row) => `
              <div class="role-row" data-staff-role="${row.id}">
                <span>${row.label}</span>
                <strong>${row.count}</strong>
                <em>${row.share}</em>
              </div>
            `
          )
          .join("")}
      </div>
      <div class="employee-roster" aria-label="${staff.rosterLabel}">
        <span class="roster-title">${staff.rosterLabel}</span>
        ${staff.employeeRows
          .map(
            (employee) => `
              <div
                class="employee-row"
                data-employee-id="${employee.id}"
                data-resignation-risk="${employee.resignationRiskLevel}"
              >
                <div>
                  <strong>${employee.role}</strong>
                  <span>${employee.personality} / ${employee.managementLevel}</span>
                </div>
                <div>
                  <span>${employee.salary}</span>
                  <small>${copy.target} ${employee.targetSalary}</small>
                </div>
                <div>
                  <span>${employee.tenure}</span>
                  <small>${employee.resignationRiskLevel} ${employee.resignationRisk}</small>
                  <button
                    class="raise-button"
                    type="button"
                    data-action-id="raise-employee-salary"
                    data-employee-id="${employee.id}"
                    data-raise-salary="${employee.raiseSalaryAmount}"
                  >
                    ${employee.raiseActionLabel} ${employee.raiseSalary}
                  </button>
                  <button
                    class="terminate-button"
                    type="button"
                    data-action-id="terminate-employee"
                    data-employee-id="${employee.id}"
                  >
                    ${employee.terminateActionLabel}
                  </button>
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function createActionRequest(
  actionId: string,
  source?: HTMLButtonElement
): SessionActionRequest {
  if (actionId === "advance-30-days") {
    return { id: "advance-30-days" };
  }

  if (actionId === "recruit-candidate") {
    return {
      id: "recruit-candidate",
      salary: readNumberData(source, "salary"),
      equityPercent: readNumberData(source, "equity")
    };
  }

  if (actionId === "skip-candidate") {
    return { id: "skip-candidate" };
  }

  if (actionId === "terminate-employee") {
    return {
      id: "terminate-employee",
      employeeId: source?.dataset.employeeId ?? ""
    };
  }

  if (actionId === "raise-employee-salary") {
    return {
      id: "raise-employee-salary",
      employeeId: source?.dataset.employeeId ?? "",
      salary: readNumberData(source, "raiseSalary")
    };
  }

  if (actionId === "request-bank-loan") {
    return { id: "request-bank-loan", amount: 80_000 };
  }

  if (actionId === "request-policy-support") {
    return { id: "request-policy-support" };
  }

  if (actionId === "prepare-ipo") {
    return { id: "prepare-ipo" };
  }

  if (actionId === "change-culture") {
    const culture = readCompanyCulture(source?.dataset.culture);
    if (culture) {
      return { id: "change-culture", culture };
    }

    const index = Math.max(0, session.state?.day ?? 0) % CULTURE_ROTATION.length;
    return CULTURE_ROTATION[index];
  }

  return { id: "advance-30-days" };
}

function renderRecruitmentPanel(
  recruitment: NonNullable<ReturnType<typeof createWebScreenModel>["recruitment"]>,
  copy: ReturnType<typeof createWebScreenModel>["copy"]
): string {
  return `
    <section class="recruitment-panel" aria-label="${copy.recruitmentDesk}">
      <div class="panel-heading">
        <span>${copy.recruitmentDesk}</span>
        <strong>${recruitment.role}</strong>
      </div>
      <dl class="candidate-meta">
        <div>
          <dt>${copy.target}</dt>
          <dd>${recruitment.targetSalary}</dd>
        </div>
        <div>
          <dt>${copy.minimum}</dt>
          <dd>${recruitment.minimumSalary}</dd>
        </div>
        <div>
          <dt>${copy.type}</dt>
          <dd>${recruitment.seniority} / ${recruitment.personality}</dd>
        </div>
        <div>
          <dt>${copy.background}</dt>
          <dd>${recruitment.background}</dd>
        </div>
      </dl>
      <div class="ability-grid">
        ${recruitment.abilityRows
          .map(
            (row) => `
              <div class="ability-row">
                <span>${row.label}</span>
                <strong>${row.value}</strong>
              </div>
            `
          )
          .join("")}
      </div>
      <div class="offer-grid">
        ${recruitment.offerOptions
          .map(
            (offer) => `
              <button
                class="offer-button ${offer.id === "next-candidate" ? "secondary-offer" : ""}"
                type="button"
                data-offer-id="${offer.id}"
                data-action-id="${offer.actionId}"
                ${offer.salary ? `data-salary="${offer.salary}"` : ""}
                ${offer.equityPercent ? `data-equity="${offer.equityPercent}"` : ""}
              >
                ${offer.label}
              </button>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderFinancePanel(
  finance: NonNullable<ReturnType<typeof createWebScreenModel>["finance"]>,
  copy: ReturnType<typeof createWebScreenModel>["copy"]
): string {
  return `
    <section class="finance-panel" aria-label="${copy.financeDesk}">
      <div class="panel-heading">
        <span>${copy.financeDesk}</span>
        <strong>${finance.valuationBasisLabel}</strong>
      </div>
      <dl class="finance-grid">
        <div>
          <dt>${copy.runway}</dt>
          <dd>${finance.runway}</dd>
        </div>
        <div>
          <dt>${copy.cash}</dt>
          <dd>${finance.cash}</dd>
        </div>
        <div>
          <dt>${copy.debt}</dt>
          <dd>${finance.debt}</dd>
        </div>
        <div>
          <dt>${copy.burn}</dt>
          <dd>${finance.monthlyBurn}${copy.perMonthSuffix}</dd>
        </div>
      </dl>
      <dl
        class="market-board"
        aria-label="${finance.marketBoard.sourceLabel}"
        data-market-basis="${finance.marketBoard.basis}"
      >
        <div>
          <dt>${copy.source}</dt>
          <dd>${finance.marketBoard.sourceLabel}</dd>
        </div>
        <div>
          <dt>${copy.value}</dt>
          <dd>${finance.marketBoard.value}</dd>
        </div>
        <div>
          <dt>${copy.sentiment}</dt>
          <dd>${finance.marketBoard.sentiment}</dd>
        </div>
      </dl>
      <div class="ipo-checklist" aria-label="${copy.ipoRequirements}">
        <span class="checklist-title">${copy.ipoRequirements}</span>
        ${finance.ipoRequirements
          .map(
            (requirement) => `
              <div
                class="ipo-requirement ${requirement.met ? "is-met" : "is-open"}"
                data-ipo-requirement="${requirement.id}"
              >
                <span>${requirement.label}</span>
                <strong>${requirement.current} / ${requirement.required}</strong>
              </div>
            `
          )
          .join("")}
      </div>
      <div class="finance-actions">
        <button
          class="finance-button"
          type="button"
          data-action-id="${finance.loanOption.actionId}"
          data-loan-amount="80000"
          ${finance.loanOption.eligible ? "" : "disabled"}
        >
          ${copy.loanPrefix} ${finance.loanOption.amount}
        </button>
        <button
          class="finance-button secondary-finance ${finance.ipoStatus.completed ? "completed-finance" : ""}"
          type="button"
          data-action-id="${finance.ipoStatus.actionId}"
          data-ipo-completed="${finance.ipoStatus.completed ? "true" : "false"}"
          ${finance.ipoStatus.ready ? "" : "disabled"}
        >
          ${finance.ipoStatus.label}
        </button>
      </div>
    </section>
  `;
}

function renderEventFeed(screen: ReturnType<typeof createWebScreenModel>): string {
  const filterBar =
    screen.eventFilterOptions.length > 0
      ? `
        <div class="event-filter-bar" aria-label="${screen.copy.eventFilterAria}">
          ${screen.eventFilterOptions
            .map(
              (option) => `
                <button
                  class="event-filter-button ${option.selected ? "is-selected" : ""}"
                  type="button"
                  data-event-filter="${option.id}"
                  aria-pressed="${option.selected ? "true" : "false"}"
                >
                  <span>${option.label}</span>
                  <strong>${option.count}</strong>
                </button>
              `
            )
            .join("")}
        </div>
      `
      : "";
  const entries =
    screen.eventItems.length > 0
      ? screen.eventItems
          .map(
            (item) => `
              <li
                class="event-item"
                data-event-type="${item.type}"
                data-event-category="${item.category}"
                data-event-severity="${item.severity}"
                data-event-day="${item.day}"
              >
                <span class="event-meta">
                  <span class="event-day">D${item.day}</span>
                  <span class="event-tag">${item.categoryLabel}</span>
                  <span class="event-severity">${item.severityLabel}</span>
                </span>
                <span class="event-text">${item.text}</span>
              </li>
            `
          )
          .join("")
      : screen.eventFeed.map((entry) => `<li class="event-item">${entry}</li>`).join("");

  return `${filterBar}<ol class="event-feed">${entries}</ol>`;
}

function renderMapTile(
  tile: ReturnType<typeof createWebScreenModel>["mapTiles"][number]
): string {
  const style = `grid-area: ${tile.gridArea};`;

  if (tile.kind === "district") {
    return `
      <button
        class="map-tile district-tile ${tile.variant}"
        type="button"
        style="${style}"
        data-zone-id="${tile.zoneId}"
        data-tile-id="${tile.id}"
        ${tile.enabled ? "" : "disabled"}
      >
        <span>${tile.label}</span>
      </button>
    `;
  }

  return `
    <div
      class="map-tile infrastructure-tile ${tile.variant}"
      style="${style}"
      data-tile-id="${tile.id}"
      aria-hidden="true"
    >
      <span>${tile.label}</span>
    </div>
  `;
}

function readNumberData(source: HTMLButtonElement | undefined, key: string): number | undefined {
  const value = source?.dataset[key];
  return value ? Number(value) : undefined;
}

function readEventCategoryFilter(value: string | undefined): WebEventCategoryFilter | undefined {
  if (
    value === "all" ||
    value === "founder" ||
    value === "people" ||
    value === "finance" ||
    value === "market" ||
    value === "society" ||
    value === "legal" ||
    value === "operations"
  ) {
    return value;
  }

  return undefined;
}

function readCompanyCulture(
  value: string | undefined
): Extract<SessionActionRequest, { id: "change-culture" }>["culture"] | undefined {
  if (
    value === "wolf" ||
    value === "laissez-faire" ||
    value === "adaptive" ||
    value === "striver"
  ) {
    return value;
  }

  return undefined;
}

function getAppRoot(): HTMLDivElement {
  const appRoot = document.querySelector<HTMLDivElement>("#app");
  if (!appRoot) {
    throw new Error("Missing #app root");
  }

  return appRoot;
}

function readInitialLanguage(): WebLanguage {
  try {
    return resolveWebLanguage(localStorage.getItem("i-am-boss-language") ?? DEFAULT_WEB_LANGUAGE);
  } catch {
    return DEFAULT_WEB_LANGUAGE;
  }
}

function storeLanguage(nextLanguage: WebLanguage): void {
  try {
    localStorage.setItem("i-am-boss-language", nextLanguage);
  } catch {
    return;
  }
}
