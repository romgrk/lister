" !::exe [So]

nnoremap <C-b> :call <SID>lister()<CR>

let s:dirname = expand('<sfile>:p:h:h')
let s:executable = s:dirname . "/bin/lister"

function! s:lister()
  let cmd =  s:executable . " --input data/files.json"
  call s:run(cmd, getcwd(), function('s:lister_sink'))
endfunc

function! s:lister_sink(opts) dict
  let output = json_decode(join(a:opts.stdout, ''))
  echom output
  if output.ok
    execute 'edit' output.item.text
  end
endfunc


" runs a command then calls Fn handler
function! s:run(cmd, cwd, Fn)
  let opts = {}
  let opts.cmd = a:cmd
  let opts.cwd = fnamemodify(expand(a:cwd), ':p')
  let opts.stdout = []
  let opts.stderr = []
  let opts.on_stdout = function('s:on_stdout')
  let opts.on_stderr = function('s:on_stderr')
  let opts.on_exit = function('s:on_exit')
  let opts.handler = a:Fn
  let opts.jobID = jobstart(a:cmd, opts)
  return opts
endfunction
function! s:on_stdout(jobID, data, event) dict
  call extend(self.stdout, a:data)
endfunction
function! s:on_stderr(jobID, data, event) dict
  call extend(self.stderr, a:data)
endfunction
function! s:on_exit(...) dict
  let self.stdout = filter(self.stdout, "v:val != ''")
  let self.stderr = filter(self.stderr, "v:val != ''")
  call self.handler(self)
endfunction

