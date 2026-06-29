import { Project, SyntaxKind } from "ts-morph";
import fs from "fs";
import path from "path";

const project = new Project({ tsConfigFilePath: "tsconfig.app.json" });

const fileMappings = {
  "src/features/pages.tsx": {
    "LoginPage": "src/features/auth/LoginPage.tsx",
    "ChangePasswordPage": "src/features/auth/ChangePasswordPage.tsx",
    "DashboardPage": "src/features/dashboard/DashboardPage.tsx",
    "ProfilePage": "src/features/profile/ProfilePage.tsx",
    "ForbiddenPage": "src/features/system/ForbiddenPage.tsx",
    "NotFoundPage": "src/features/system/NotFoundPage.tsx"
  },
  "src/features/academic/academic-pages.tsx": {
    "AssignLecturerPage": "src/features/academic/AssignLecturerPage.tsx",
    "CourseCatalogPage": "src/features/academic/CourseCatalogPage.tsx",
    "CreateSectionPage": "src/features/academic/CreateSectionPage.tsx",
    "RegistrationManagementPage": "src/features/academic/RegistrationManagementPage.tsx",
    "ReportsPage": "src/features/academic/ReportsPage.tsx",
    "ScheduleRoomsPage": "src/features/academic/ScheduleRoomsPage.tsx",
    "WaitlistOverridePage": "src/features/academic/WaitlistOverridePage.tsx",
    "WishReviewPage": "src/features/academic/WishReviewPage.tsx"
  },
  "src/features/admin/admin-pages.tsx": {
    "AuditLogsPage": "src/features/admin/AuditLogsPage.tsx",
    "RolesPage": "src/features/admin/RolesPage.tsx",
    "SettingsPage": "src/features/admin/SettingsPage.tsx",
    "UserAccountsPage": "src/features/admin/UserAccountsPage.tsx"
  },
  "src/features/lecturer/lecturer-pages.tsx": {
    "AssignedSectionsPage": "src/features/lecturer/AssignedSectionsPage.tsx",
    "SectionStudentsPage": "src/features/lecturer/SectionStudentsPage.tsx",
    "SemesterTeachingPage": "src/features/lecturer/SemesterTeachingPage.tsx",
    "WeekTeachingPage": "src/features/lecturer/WeekTeachingPage.tsx"
  },
  "src/features/student/student-pages.tsx": {
    "CancelRegistrationPage": "src/features/student/CancelRegistrationPage.tsx",
    "CourseDetailPage": "src/features/student/CourseDetailPage.tsx",
    "HistoryPage": "src/features/student/HistoryPage.tsx",
    "OpenSectionsPage": "src/features/student/OpenSectionsPage.tsx",
    "PrerequisitePage": "src/features/student/PrerequisitePage.tsx",
    "RegisteredPage": "src/features/student/RegisteredPage.tsx",
    "RegisterPage": "src/features/student/RegisterPage.tsx",
    "SemesterSchedulePage": "src/features/student/SemesterSchedulePage.tsx",
    "WeekSchedulePage": "src/features/student/WeekSchedulePage.tsx",
    "WishPage": "src/features/student/WishPage.tsx",
  }
};

async function run() {
  for (const [godFile, mappings] of Object.entries(fileMappings)) {
    const sourceFile = project.getSourceFile(godFile);
    if (!sourceFile) continue;

    const imports = sourceFile.getImportDeclarations().map(i => i.getText()).join('\n');
    const helpers = [];
    sourceFile.getStatements().forEach(stmt => {
      if ([SyntaxKind.FunctionDeclaration, SyntaxKind.VariableStatement, SyntaxKind.InterfaceDeclaration, SyntaxKind.TypeAliasDeclaration].includes(stmt.getKind())) {
        if (stmt.hasModifier && stmt.hasModifier(SyntaxKind.ExportKeyword)) {
          let name;
          if (stmt.getKind() === SyntaxKind.FunctionDeclaration) name = stmt.getName();
          else if (stmt.getKind() === SyntaxKind.VariableStatement) name = stmt.getDeclarations()[0].getName();
          if (name && mappings[name]) return;
        }
        helpers.push(stmt.getText());
      }
    });

    for (const [compName, targetPath] of Object.entries(mappings)) {
      const func = sourceFile.getFunction(compName);
      if (!func) continue;

      const componentCode = func.getText();
      const fileContent = `\n${imports}\n\n${helpers.join('\n\n')}\n\n${componentCode}\n\nexport default ${compName};\n`;
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, fileContent.trim() + '\n');
    }

    let barrelCode = '';
    for (const [compName, targetPath] of Object.entries(mappings)) {
      const relativePath = './' + path.relative(path.dirname(godFile), targetPath).replace(/\\/g, '/').replace('.tsx', '');
      barrelCode += `export { ${compName}, default as ${compName}Default } from '${relativePath}';\n`;
    }
    fs.writeFileSync(godFile, barrelCode);
  }
}
run().catch(console.error);
