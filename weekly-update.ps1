# Ukentlig automatisk oppdatering av tilbud
# Kjøres hver søndag/mandag når nye tilbudsaviser kommer

$ErrorActionPreference = "Stop"
$workspaceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  UKENTLIG TILBUDSOPPDATERING" -ForegroundColor Cyan
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Funksjon for å slette pending fra cache
function Remove-PendingFromCache {
    Write-Host "`n[STEG] Sletter pending produkter fra cache..." -ForegroundColor Yellow
    
    $cacheFile = "$workspaceRoot\backend\persistence\src\resources\category_cache.json"
    $cache = Get-Content $cacheFile -Raw -Encoding UTF8 | ConvertFrom-Json
    
    $allEntries = @($cache.PSObject.Properties)
    $pendingCount = 0
    $cleaned = @{}
    
    foreach ($entry in $allEntries) {
        $val = $entry.Value
        $isPending = ($val.subCategory -eq 'Annet') -or 
                     ($val.confidence.main -lt 0.90) -or 
                     ($val.confidence.sub -lt 0.88) -or 
                     ($val.confidence.ingredientKey -lt 0.90)
        
        if ($isPending) {
            $pendingCount++
        } else {
            $cleaned[$entry.Name] = $val
        }
    }
    
    $cleaned | ConvertTo-Json -Depth 10 | Set-Content $cacheFile -Encoding UTF8
    
    Write-Host "  ✓ Slettet $pendingCount pending produkter" -ForegroundColor Green
    Write-Host "  ✓ Gjenstår $($cleaned.Count) trusted produkter`n" -ForegroundColor Green
    
    return $pendingCount
}

# Funksjon for å kjøre AI kategorisering
function Start-AICategorization {
    param([int]$iteration)
    
    Write-Host "`n[STEG] AI Kategorisering - Iterasjon $iteration" -ForegroundColor Yellow
    
    # Start backend med AI
    $env:SKIP_AI = "false"
    Push-Location $workspaceRoot
    
    Write-Host "  → Starter backend med AI..." -ForegroundColor Gray
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd $workspaceRoot && npm start" -NoNewWindow -PassThru | Out-Null
    
    # Vent på at server starter
    Write-Host "  → Venter på server..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
    
    # Vent på at AI kategorisering er ferdig (server logger "✅ AI-kategorisering: X trusted, Y pending")
    Write-Host "  → AI kategoriserer produkter..." -ForegroundColor Gray
    Start-Sleep -Seconds 30
    
    Pop-Location
    Write-Host "  ✓ Iterasjon $iteration fullført`n" -ForegroundColor Green
}

# Funksjon for å telle pending
function Get-PendingCount {
    $cacheFile = "$workspaceRoot\backend\persistence\src\resources\category_cache.json"
    $cache = Get-Content $cacheFile -Raw -Encoding UTF8 | ConvertFrom-Json
    
    $pendingCount = 0
    foreach ($entry in $cache.PSObject.Properties) {
        $val = $entry.Value
        if (($val.subCategory -eq 'Annet') -or 
            ($val.confidence.main -lt 0.90) -or 
            ($val.confidence.sub -lt 0.88) -or 
            ($val.confidence.ingredientKey -lt 0.90)) {
            $pendingCount++
        }
    }
    
    return $pendingCount
}

try {
    # STEG 1: Hent nye tilbud
    Write-Host "[STEG 1] Henter nye tilbudsaviser..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/offers/update" -Method POST -TimeoutSec 120
    Write-Host "  ✓ Hentet nye tilbud`n" -ForegroundColor Green
    
    # STEG 2: Første AI-kjøring (nye produkter)
    Write-Host "[STEG 2] AI Iterasjon 1 - Kategoriserer nye produkter" -ForegroundColor Yellow
    Start-AICategorization -iteration 1
    
    $pending = Get-PendingCount
    Write-Host "  → $pending produkter er pending etter iterasjon 1`n" -ForegroundColor Cyan
    
    if ($pending -eq 0) {
        Write-Host "✅ Alle produkter kategorisert! Ingen behov for flere iterasjoner.`n" -ForegroundColor Green
        exit 0
    }
    
    # STEG 3: Andre AI-kjøring
    Write-Host "[STEG 3] AI Iterasjon 2 - Prøver pending på nytt" -ForegroundColor Yellow
    Remove-PendingFromCache | Out-Null
    Start-AICategorization -iteration 2
    
    $pending = Get-PendingCount
    Write-Host "  → $pending produkter er pending etter iterasjon 2`n" -ForegroundColor Cyan
    
    if ($pending -eq 0) {
        Write-Host "✅ Alle produkter kategorisert etter 2 iterasjoner!`n" -ForegroundColor Green
        exit 0
    }
    
    # STEG 4: Tredje AI-kjøring (siste sjanse)
    Write-Host "[STEG 4] AI Iterasjon 3 - Siste kategoriseringsforsøk" -ForegroundColor Yellow
    Remove-PendingFromCache | Out-Null
    Start-AICategorization -iteration 3
    
    $pending = Get-PendingCount
    Write-Host "  → $pending produkter er fortsatt pending etter iterasjon 3`n" -ForegroundColor Cyan
    
    # STEG 5: Rapporter resultat
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  UKENTLIG OPPDATERING FULLFØRT" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    if ($pending -eq 0) {
        Write-Host "✅ SUKSESS: Alle produkter kategorisert automatisk!`n" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $pending produkter krever manuell review" -ForegroundColor Yellow
        Write-Host "   Gå til Admin Review: http://localhost:5173/admin`n" -ForegroundColor Yellow
    }
    
    Write-Host "Ferdig: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n" -ForegroundColor Cyan

} catch {
    Write-Host "`n❌ FEIL under oppdatering:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
